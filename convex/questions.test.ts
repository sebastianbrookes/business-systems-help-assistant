/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { startingArticles } from "./startingArticles";
import { startingItTeamNotes } from "./startingItTeamNotes";

const modules = import.meta.glob("./**/*.ts");
const visitorId = "visitor-1";

beforeEach(() => vi.stubEnv("OPENROUTER_API_KEY", "test-key"));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

async function setup() {
  const t = convexTest(schema, modules);
  await t.mutation(internal.seed.load);
  const articleId = (title: string) =>
    t.run(async (ctx) => {
      const articles = await ctx.db.query("helpArticles").collect();
      return articles.find((a) => a.title === title)!._id;
    });
  /** Adds a starting Gap group holding starting No match questions. */
  const addStartingGroup = (title: string, questionTexts: string[]) =>
    t.run(async (ctx) => {
      const gapGroupId = await ctx.db.insert("gapGroups", { title });
      for (const text of questionTexts) {
        await ctx.db.insert("questions", {
          text,
          answer: "",
          citedArticleIds: [],
          outcome: "gap",
          gapReason: "noMatch",
          gapGroupId,
        });
      }
      return gapGroupId;
    });
  return { t, articleId, addStartingGroup };
}

/** Fakes OpenRouter replying with each of `contents` in turn as the model's message. */
function fakeModelReply(...contents: unknown[]) {
  let call = 0;
  const fetch = vi.fn<typeof globalThis.fetch>(async () => {
    const content = contents[call++];
    return Response.json({
      choices: [
        {
          message: {
            content:
              typeof content === "string" ? content : JSON.stringify(content),
          },
        },
      ],
    });
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

test("an answered question shows its answer, cited article, and team to contact", async () => {
  const { t, articleId } = await setup();
  const punchout = await articleId(
    "Ordering lab supplies through a Coupa punchout",
  );
  fakeModelReply({
    outcome: "answered",
    answer: "Open Shop in Coupa and choose the Fisher punchout tile.",
    citedArticleIds: [punchout],
    gapReason: null,
    department: "Finance",
    system: "Coupa",
  });

  await t.action(api.questions.ask, {
    visitorId,
    text: "How do I order lab supplies from Fisher?",
  });

  const questions = await t.query(api.questions.list, { visitorId });
  expect(questions).toMatchObject([
    {
      text: "How do I order lab supplies from Fisher?",
      outcome: "answered",
      answer: "Open Shop in Coupa and choose the Fisher punchout tile.",
      citedArticles: [
        {
          title: "Ordering lab supplies through a Coupa punchout",
          contactTeam: "Procurement & AP",
        },
      ],
      department: "Finance",
      system: "Coupa",
    },
  ]);
});

test("the answer call sees every Help article and none of the IT team notes", async () => {
  const { t } = await setup();
  const fetch = fakeModelReply({
    outcome: "offTopic",
    answer: "",
    citedArticleIds: [],
    gapReason: null,
    department: null,
    system: null,
  });

  await t.action(api.questions.ask, {
    visitorId,
    text: "Do I need an MTA to send samples to our Durham site?",
  });

  const { messages } = JSON.parse(String(fetch.mock.calls[0][1]?.body));
  const prompt = messages.map((m: { content: string }) => m.content).join("\n");
  for (const a of startingArticles) expect(prompt).toContain(a.title);
  // Each note's opening words, before any quotes that JSON would escape.
  for (const n of startingItTeamNotes) {
    expect(prompt).not.toContain(n.text.slice(0, 40));
  }
});

test("an Off topic question gets a polite decline and is never a Gap", async () => {
  const { t } = await setup();
  fakeModelReply({
    outcome: "offTopic",
    answer: "Try 5% milk in TBST.",
    citedArticleIds: [],
    gapReason: null,
    department: null,
    system: null,
  });

  await t.action(api.questions.ask, {
    visitorId,
    text: "What's a good blocking buffer for a Western blot?",
  });

  const [question] = await t.query(api.questions.list, { visitorId });
  expect(question.outcome).toBe("offTopic");
  expect(question.answer).toMatch(/only help with .* business systems/);
  expect(question.answer).not.toContain("TBST");
  expect(question.gapReason).toBeUndefined();
  expect(question.citedArticles).toEqual([]);
});

const validAnswer = {
  outcome: "answered",
  answer: "Open Shop in Coupa.",
  gapReason: null,
  department: "Finance",
  system: "Coupa",
};

test.each([
  ["text that isn't JSON", "Sure! Open Shop in Coupa."],
  ["an answer that cites no article", { ...validAnswer, citedArticleIds: [] }],
  [
    "an answer citing an unknown article",
    { ...validAnswer, citedArticleIds: ["not-an-article"] },
  ],
  [
    "an unknown outcome",
    { ...validAnswer, outcome: "maybe", citedArticleIds: [] },
  ],
])("model output with %s is rejected and nothing is saved", async (_, reply) => {
  const { t } = await setup();
  fakeModelReply(reply, { gapGroupId: null, newGroupTitle: "Buying gloves" });

  await expect(
    t.action(api.questions.ask, { visitorId, text: "How do I buy gloves?" }),
  ).rejects.toThrow(/unusable reply/);

  expect(await t.query(api.questions.list, { visitorId })).toEqual([]);
});

test("a No match question logs a Gap, shows related articles, and starts a new Gap group", async () => {
  const { t, articleId } = await setup();
  const mta = await articleId(
    "Requesting a material transfer agreement (MTA) in Ironclad",
  );
  fakeModelReply(
    {
      outcome: "gap",
      answer: "The Help articles don't cover shipping samples between sites.",
      citedArticleIds: [mta],
      gapReason: "noMatch",
      department: "Ops",
      system: "ServiceNow",
    },
    { gapGroupId: null, newGroupTitle: "Shipping samples between sites" },
  );

  await t.action(api.questions.ask, {
    visitorId,
    text: "How do I ship frozen samples to Durham?",
  });

  const [question] = await t.query(api.questions.list, { visitorId });
  expect(question).toMatchObject({
    outcome: "gap",
    gapReason: "noMatch",
    answer: "The Help articles don't cover shipping samples between sites.",
    citedArticles: [
      { title: "Requesting a material transfer agreement (MTA) in Ironclad" },
    ],
  });
  expect(await t.query(api.gapGroups.list, { visitorId })).toMatchObject([
    { title: "Shipping samples between sites", questionCount: 1 },
  ]);
});

test("a partly covered question answers the covered part and logs a Not covered Gap", async () => {
  const { t, articleId } = await setup();
  const timeOff = await articleId("Requesting time off in Workday");
  fakeModelReply(
    {
      outcome: "gap",
      answer:
        "Request time off under Absence in Workday. The article doesn't say whether unused days carry over.",
      citedArticleIds: [timeOff],
      gapReason: "notCovered",
      department: "HR",
      system: "Workday",
    },
    { gapGroupId: null, newGroupTitle: "Carrying over unused time off" },
  );

  await t.action(api.questions.ask, {
    visitorId,
    text: "How do I book a day off, and do unused days carry over?",
  });

  const [question] = await t.query(api.questions.list, { visitorId });
  expect(question).toMatchObject({
    outcome: "gap",
    gapReason: "notCovered",
    answer: expect.stringContaining("Absence in Workday"),
    citedArticles: [
      { title: "Requesting time off in Workday", contactTeam: expect.any(String) },
    ],
  });
  expect(await t.query(api.gapGroups.list, { visitorId })).toMatchObject([
    { title: "Carrying over unused time off", questionCount: 1 },
  ]);
});

const samplesGap = (citedArticleIds: string[]) => ({
  outcome: "gap",
  answer: "The Help articles don't cover shipping samples between sites.",
  citedArticleIds,
  gapReason: "noMatch",
  department: "Ops",
  system: "ServiceNow",
});

test("a Gap joins an existing Gap group, whose count includes the Visitor's question", async () => {
  const { t, articleId, addStartingGroup } = await setup();
  const mta = await articleId(
    "Requesting a material transfer agreement (MTA) in Ironclad",
  );
  const samples = await addStartingGroup(
    "Sending samples between Cambridge and Durham",
    ["How do I courier samples to Durham?", "Can I mail cell lines to NC?"],
  );
  await addStartingGroup("Parking at the Durham site", [
    "Where do I park in Durham?",
  ]);
  fakeModelReply(samplesGap([mta]), {
    gapGroupId: samples,
    newGroupTitle: null,
  });

  await t.action(api.questions.ask, {
    visitorId,
    text: "How do I ship frozen samples to Durham?",
  });

  expect(await t.query(api.gapGroups.list, { visitorId })).toMatchObject([
    { title: "Sending samples between Cambridge and Durham", questionCount: 3 },
    { title: "Parking at the Durham site", questionCount: 1 },
  ]);
  const group = await t.query(api.gapGroups.get, {
    visitorId,
    gapGroupId: samples,
  });
  expect(group.questions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        text: "How do I courier samples to Durham?",
        gapReason: "noMatch",
      }),
      expect.objectContaining({
        text: "How do I ship frozen samples to Durham?",
        gapReason: "noMatch",
      }),
    ]),
  );
  expect(group.questions).toHaveLength(3);
});

test("Didn't help flags an answer, logs a Gap with that reason, and shows the IT team the answer", async () => {
  const { t, articleId } = await setup();
  const mfa = await articleId("Moving MFA to a new phone");
  fakeModelReply(
    {
      outcome: "answered",
      answer: "Text the code sent by SMS to your new number.",
      citedArticleIds: [mfa],
      gapReason: null,
      department: "IT",
      system: "Microsoft 365",
    },
    { gapGroupId: null, newGroupTitle: "Moving MFA to a new phone" },
  );
  const questionId = await t.action(api.questions.ask, {
    visitorId,
    text: "How do I set up MFA on my new phone?",
  });

  await t.action(api.questions.didntHelp, { visitorId, questionId });

  const [question] = await t.query(api.questions.list, { visitorId });
  expect(question).toMatchObject({
    outcome: "answered",
    didntHelp: true,
    answer: "Text the code sent by SMS to your new number.",
    citedArticles: [{ title: "Moving MFA to a new phone" }],
  });
  const [group] = await t.query(api.gapGroups.list, { visitorId });
  expect(group).toMatchObject({
    title: "Moving MFA to a new phone",
    questionCount: 1,
  });
  expect(
    await t.query(api.gapGroups.get, { visitorId, gapGroupId: group._id }),
  ).toMatchObject({
    questions: [
      {
        text: "How do I set up MFA on my new phone?",
        gapReason: "didntHelp",
        answer: "Text the code sent by SMS to your new number.",
      },
    ],
  });
});

test("a Visitor never sees another Visitor's questions, Gaps, or Gap groups", async () => {
  const { t, articleId, addStartingGroup } = await setup();
  const mta = await articleId(
    "Requesting a material transfer agreement (MTA) in Ironclad",
  );
  const samples = await addStartingGroup(
    "Sending samples between Cambridge and Durham",
    ["How do I courier samples to Durham?"],
  );
  const other = "visitor-2";

  fakeModelReply(samplesGap([mta]), {
    gapGroupId: samples,
    newGroupTitle: null,
  });
  const ownQuestion = await t.action(api.questions.ask, {
    visitorId,
    text: "How do I ship frozen samples to Durham?",
  });
  fakeModelReply(samplesGap([mta]), {
    gapGroupId: null,
    newGroupTitle: "Shipping dry ice",
  });
  await t.action(api.questions.ask, {
    visitorId,
    text: "Who packs dry ice shipments?",
  });
  const [, ownGroup] = await t.query(api.gapGroups.list, { visitorId });

  expect(await t.query(api.questions.list, { visitorId: other })).toEqual([]);
  expect(
    await t.query(api.gapGroups.list, { visitorId: other }),
  ).toMatchObject([
    { title: "Sending samples between Cambridge and Durham", questionCount: 1 },
  ]);
  expect(
    await t.query(api.gapGroups.get, { visitorId: other, gapGroupId: samples }),
  ).toMatchObject({
    questions: [{ text: "How do I courier samples to Durham?" }],
  });
  await expect(
    t.query(api.gapGroups.get, {
      visitorId: other,
      gapGroupId: ownGroup._id,
    }),
  ).rejects.toThrow(/not found/);
  await expect(
    t.action(api.questions.didntHelp, {
      visitorId: other,
      questionId: ownQuestion,
    }),
  ).rejects.toThrow(/your own/);

  // The grouping call can't put a Gap in a group the Visitor can't see.
  fakeModelReply(samplesGap([mta]), {
    gapGroupId: ownGroup._id,
    newGroupTitle: null,
  });
  await expect(
    t.action(api.questions.ask, {
      visitorId: other,
      text: "Who packs dry ice shipments?",
    }),
  ).rejects.toThrow(/unusable reply/);
  expect(await t.query(api.questions.list, { visitorId: other })).toEqual([]);
});
