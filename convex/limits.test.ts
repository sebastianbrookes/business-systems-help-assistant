import { expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import {
  fakeModelReply,
  fakeOutOfCredit,
  setup,
  setupWithHistory,
  useTestEnv,
} from "./test.helpers";

const visitorId = "visitor-1";

useTestEnv();

const offTopic = {
  outcome: "offTopic",
  answer: "",
  citedArticleIds: [],
  gapReason: null,
  department: null,
  system: null,
};

const gap = {
  outcome: "gap",
  answer: "The Help articles don't cover this.",
  citedArticleIds: [],
  gapReason: "noMatch",
  department: null,
  system: null,
};

const PAUSED = /paused.*Suggested question/;

/** Fakes the clock at `iso`, a UTC time. */
function setNow(iso: string) {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(iso));
}

type TestDeployment = Awaited<ReturnType<typeof setup>>["t"];

/** Has `id` ask `count` typed questions that the model calls Off topic. */
async function askOffTopic(t: TestDeployment, count: number, id = visitorId) {
  fakeModelReply(...Array(count).fill(offTopic));
  for (let i = 0; i < count; i++) {
    await t.action(api.questions.ask, { visitorId: id, text: `Question ${i}` });
  }
}

/** Has the Visitor ask a typed question and returns how it was saved. */
async function askOne(t: TestDeployment, text = "How do I buy gloves?", id = visitorId) {
  const questionId = await t.action(api.questions.ask, { visitorId: id, text });
  const questions = await t.query(api.questions.list, { visitorId: id });
  return questions.find((q) => q._id === questionId)!;
}

test("a Visitor gets 15 AI calls a day, and a Gap's grouping call doesn't count", async () => {
  setNow("2026-10-04T12:00:00Z");
  const t = await setupWithHistory();
  const replies = Array.from({ length: 15 }, (_, i) => [
    gap,
    { gapGroupId: null, newGroupTitle: `Gap ${i}` },
  ]).flat();
  const fetch = fakeModelReply(...replies);
  for (let i = 0; i < 15; i++) {
    expect(await askOne(t, `Gap question ${i}`)).toMatchObject({ outcome: "gap" });
  }
  expect(fetch).toHaveBeenCalledTimes(30);

  const paused = await askOne(t, "How do I buy gloves?");

  expect(fetch).toHaveBeenCalledTimes(30);
  expect(paused).toMatchObject({
    text: "How do I buy gloves?",
    outcome: "paused",
    answer: expect.stringMatching(PAUSED),
    citedArticles: [],
  });
  // Suggested questions still work and use no limit.
  const [suggested] = await t.query(api.questions.suggested, {});
  await t.mutation(api.questions.askSuggested, {
    visitorId,
    suggestedQuestionId: suggested._id,
  });
  const questions = await t.query(api.questions.list, { visitorId });
  expect(questions.at(-1)).toMatchObject({ text: suggested.text, outcome: suggested.outcome });
  // Another Visitor still has their own 15.
  fakeModelReply(offTopic);
  expect(await askOne(t, "Hi there", "visitor-2")).toMatchObject({ outcome: "offTopic" });
});

test("Draft article and Fill from IT notes clicks each count as one AI call", async () => {
  setNow("2026-10-04T12:00:00Z");
  const { t, addStartingGroup } = await setup();
  const gapGroupId = await addStartingGroup("Parking at the Durham site", [
    "Where do I park in Durham?",
  ]);
  await askOffTopic(t, 13);
  fakeModelReply(
    {
      title: "Parking at the Durham site",
      department: "Ops",
      system: "ServiceNow",
      contactTeam: "Workplace & EHS",
      body: "Request a permit in ServiceNow. Permits cost [Check: the monthly permit cost].",
    },
    { fills: [{ placeholder: 1, fact: null, noteNumber: null }] },
  );
  await t.action(api.draftArticles.draft, { visitorId, gapGroupId });
  await t.action(api.draftArticles.fill, { visitorId, gapGroupId });

  const fetch = fakeModelReply(offTopic);
  expect(await askOne(t)).toMatchObject({ outcome: "paused" });
  await expect(
    t.action(api.draftArticles.fill, { visitorId, gapGroupId }),
  ).rejects.toThrow(PAUSED);
  expect(fetch).not.toHaveBeenCalled();
});

test("a Draft article click over the limit makes no draft", async () => {
  setNow("2026-10-04T12:00:00Z");
  const { t, addStartingGroup } = await setup();
  const gapGroupId = await addStartingGroup("Parking at the Durham site", [
    "Where do I park in Durham?",
  ]);
  await askOffTopic(t, 15);

  await expect(
    t.action(api.draftArticles.draft, { visitorId, gapGroupId }),
  ).rejects.toThrow(PAUSED);

  expect(
    await t.query(api.gapGroups.get, { visitorId, gapGroupId }),
  ).toMatchObject({ state: "open", draft: null });
});

test("the whole app gets 250 AI calls a day across Visitors", async () => {
  setNow("2026-10-04T12:00:00Z");
  const { t } = await setup();
  for (let v = 0; v < 25; v++) await askOffTopic(t, 10, `visitor-${v}`);

  const fetch = fakeModelReply(offTopic);
  expect(await askOne(t, "Hi", "fresh-visitor")).toMatchObject({ outcome: "paused" });
  expect(fetch).not.toHaveBeenCalled();
});

test("limits reset at the start of the next UTC day", async () => {
  setNow("2026-10-04T23:59:00Z");
  const { t } = await setup();
  await askOffTopic(t, 15);
  fakeModelReply(offTopic);
  expect(await askOne(t)).toMatchObject({ outcome: "paused" });

  // 8:00 p.m. on October 4 in Boston is already October 5 in UTC.
  setNow("2026-10-05T00:00:00Z");
  fakeModelReply(offTopic);

  expect(await askOne(t)).toMatchObject({ outcome: "offTopic" });
});

test("when OpenRouter is out of credit, a typed question is saved as paused and a Draft article click shows the paused message", async () => {
  const { t, addStartingGroup } = await setup();
  const gapGroupId = await addStartingGroup("Parking at the Durham site", [
    "Where do I park in Durham?",
  ]);
  fakeOutOfCredit();

  expect(await askOne(t)).toMatchObject({
    text: "How do I buy gloves?",
    outcome: "paused",
    answer: expect.stringMatching(PAUSED),
  });
  await expect(
    t.action(api.draftArticles.draft, { visitorId, gapGroupId }),
  ).rejects.toThrow(PAUSED);
});
