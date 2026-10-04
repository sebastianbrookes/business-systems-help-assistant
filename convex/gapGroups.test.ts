import { expect, test } from "vitest";
import { api } from "./_generated/api";
import {
  fakeModelReply,
  setup,
  setupWithHistory,
  useTestEnv,
} from "./test.helpers";

const visitorId = "visitor-1";
const SAMPLES = "Sending samples between Cambridge and Durham";

useTestEnv();

const gap = {
  outcome: "gap",
  answer: "The Help articles don't cover this.",
  citedArticleIds: [],
  gapReason: "noMatch",
  department: "Ops",
  system: "ServiceNow",
};

test("the Suggested Gap question joins a starting group, which shows the Visitor's question and the draft hint", async () => {
  const t = await setupWithHistory();
  const [, suggestedGap] = await t.query(api.questions.suggested, {});

  await t.mutation(api.questions.askSuggested, {
    visitorId,
    suggestedQuestionId: suggestedGap._id,
  });

  const groups = await t.query(api.gapGroups.list, { visitorId });
  expect(groups.find((g) => g.title === SAMPLES)).toMatchObject({
    questionCount: 5,
    includesYours: true,
    draftHint: true,
  });
  for (const g of groups.filter((g) => g.title !== SAMPLES)) {
    expect(g).toMatchObject({ includesYours: false, draftHint: false });
  }
  const other = await t.query(api.gapGroups.list, { visitorId: "visitor-2" });
  for (const g of other) {
    expect(g).toMatchObject({ includesYours: false, draftHint: false });
  }
});

test("the draft hint marks each Open group holding the Visitor's Gap until they draft an article", async () => {
  const { t, addStartingGroup } = await setup();
  const samples = await addStartingGroup(SAMPLES, ["How do I courier samples?"]);
  const parking = await addStartingGroup("Parking at the Durham site", [
    "Where do I park in Durham?",
  ]);
  const hinted = async () =>
    (await t.query(api.gapGroups.list, { visitorId }))
      .filter((g) => g.draftHint)
      .map((g) => g._id);

  expect(await hinted()).toEqual([]);

  fakeModelReply(gap, { gapGroupId: samples, newGroupTitle: null });
  await t.action(api.questions.ask, { visitorId, text: "Can I mail samples?" });
  expect(await hinted()).toEqual([samples]);

  fakeModelReply(gap, { gapGroupId: parking, newGroupTitle: null });
  await t.action(api.questions.ask, { visitorId, text: "Is there parking?" });
  expect(await hinted()).toEqual([samples, parking]);

  fakeModelReply({
    title: "Parking at the Durham site",
    department: "Ops",
    system: "ServiceNow",
    contactTeam: "Workplace & EHS",
    body: "Park in lot B.",
  });
  await t.action(api.draftArticles.draft, { visitorId, gapGroupId: parking });
  expect(await hinted()).toEqual([]);

  fakeModelReply(gap, { gapGroupId: samples, newGroupTitle: null });
  await t.action(api.questions.ask, { visitorId, text: "Who ships samples?" });
  expect(await hinted()).toEqual([]);
  expect(await t.query(api.gapGroups.list, { visitorId })).toMatchObject([
    { _id: samples, includesYours: true },
    { _id: parking, includesYours: true },
  ]);
});
