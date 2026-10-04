import { expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import { fakeModelReply, fakeOutOfCredit, setup, useTestEnv } from "./test.helpers";

const visitorId = "visitor-1";

useTestEnv();

async function setupWithStartingQuestions() {
  const s = await setup();
  const punchout = await s.articleId(
    "Ordering lab supplies through a Coupa punchout",
  );
  await s.t.run(async (ctx) => {
    const answered = {
      answer: "Open Shop in Coupa.",
      citedArticleIds: [punchout],
      outcome: "answered" as const,
      department: "Finance" as const,
      system: "Coupa" as const,
    };
    await ctx.db.insert("questions", { ...answered, text: "Fisher order?", daysAgo: 3 });
    // Too old for the last 30 days.
    await ctx.db.insert("questions", { ...answered, text: "VWR order?", daysAgo: 40 });
  });
  const samples = await s.addStartingGroup("Sending samples between sites", [
    "How do I courier samples to Durham?",
  ]);
  return { ...s, punchout, samples };
}

const answeredReply = (articleId: string) => ({
  outcome: "answered",
  answer: "Open Shop in Coupa and choose the Fisher punchout tile.",
  citedArticleIds: [articleId],
  gapReason: null,
  department: "Finance",
  system: "Coupa",
});

const gapReply = {
  outcome: "gap",
  answer: "No article covers parking in Durham.",
  citedArticleIds: [],
  gapReason: "noMatch",
  department: "Ops",
  system: "ServiceNow",
};

test("the four numbers change after the Visitor's answered question and Gap", async () => {
  const { t, punchout } = await setupWithStartingQuestions();

  // One starting answered question in the window, plus one starting Gap with no system.
  expect(await t.query(api.dashboard.get, { visitorId })).toMatchObject({
    questionsLast30Days: 2,
    percentAnswered: 50,
    openGroups: 1,
    resolvedGroups: 0,
  });

  fakeModelReply(answeredReply(punchout));
  await t.action(api.questions.ask, { visitorId, text: "How do I order from Fisher?" });
  expect(await t.query(api.dashboard.get, { visitorId })).toMatchObject({
    questionsLast30Days: 3,
    percentAnswered: 67,
    openGroups: 1,
  });

  fakeModelReply(gapReply, { gapGroupId: null, newGroupTitle: "Parking in Durham" });
  await t.action(api.questions.ask, { visitorId, text: "Where do I park in Durham?" });
  expect(await t.query(api.dashboard.get, { visitorId })).toMatchObject({
    questionsLast30Days: 4,
    percentAnswered: 50,
    openGroups: 2,
    resolvedGroups: 0,
  });
});

test("an approved draft moves its group from Open to Resolved", async () => {
  const { t, samples } = await setupWithStartingQuestions();
  fakeModelReply({
    title: "Sending samples between sites",
    department: "Ops",
    system: "ServiceNow",
    contactTeam: "Workplace & EHS",
    body: "Open a Sample Shipment request in ServiceNow.",
  });
  await t.action(api.draftArticles.draft, { visitorId, gapGroupId: samples });
  await t.mutation(api.draftArticles.approve, { visitorId, gapGroupId: samples });

  expect(await t.query(api.dashboard.get, { visitorId })).toMatchObject({
    openGroups: 0,
    resolvedGroups: 1,
  });
});

test("the chart splits each system's questions into answered and Gap", async () => {
  const { t, punchout } = await setupWithStartingQuestions();
  fakeModelReply(gapReply, { gapGroupId: null, newGroupTitle: "Parking in Durham" });
  await t.action(api.questions.ask, { visitorId, text: "Where do I park in Durham?" });
  fakeModelReply(answeredReply(punchout));
  const questionId = await t.action(api.questions.ask, {
    visitorId,
    text: "How do I order from Fisher?",
  });
  // Didn't help turns an answered question into a Gap.
  fakeModelReply({ gapGroupId: null, newGroupTitle: "Fisher orders" });
  await t.action(api.questions.didntHelp, { visitorId, questionId });

  const { bySystem } = await t.query(api.dashboard.get, { visitorId });
  expect(bySystem.slice(0, 2)).toEqual([
    { system: "Coupa", answered: 1, gap: 1, total: 2 },
    { system: "ServiceNow", answered: 0, gap: 1, total: 1 },
  ]);
  expect(bySystem[2]).toMatchObject({ total: 0 });
  // The starting Gap isn't tagged with a system.
  expect(bySystem.at(-1)).toEqual({ system: "No system", answered: 0, gap: 1, total: 1 });
});

test("Off topic and paused questions aren't counted", async () => {
  const { t } = await setupWithStartingQuestions();
  fakeModelReply({
    outcome: "offTopic",
    answer: "",
    citedArticleIds: [],
    gapReason: null,
    department: null,
    system: null,
  });
  await t.action(api.questions.ask, { visitorId, text: "Best blocking buffer?" });
  fakeOutOfCredit();
  await t.action(api.questions.ask, { visitorId, text: "How do I file an expense?" });

  expect(await t.query(api.dashboard.get, { visitorId })).toMatchObject({
    questionsLast30Days: 2,
  });
});

test("another Visitor's questions and groups never count", async () => {
  const { t, punchout } = await setupWithStartingQuestions();
  fakeModelReply(answeredReply(punchout), gapReply, {
    gapGroupId: null,
    newGroupTitle: "Parking in Durham",
  });
  await t.action(api.questions.ask, { visitorId: "visitor-2", text: "Fisher?" });
  await t.action(api.questions.ask, { visitorId: "visitor-2", text: "Parking?" });

  expect(await t.query(api.dashboard.get, { visitorId })).toMatchObject({
    questionsLast30Days: 2,
    openGroups: 1,
  });
});

test("a saved question leaves the last 30 days as the clock moves on", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-01T12:00:00Z"));
  const { t, punchout } = await setupWithStartingQuestions();
  fakeModelReply(answeredReply(punchout));
  await t.action(api.questions.ask, { visitorId, text: "How do I order from Fisher?" });
  expect(await t.query(api.dashboard.get, { visitorId })).toMatchObject({
    questionsLast30Days: 3,
  });

  // Rows saved on Oct 1 age out. Starting history counts back from today, so it stays.
  vi.setSystemTime(new Date("2026-11-01T12:00:00Z"));
  expect(await t.query(api.dashboard.get, { visitorId })).toMatchObject({
    questionsLast30Days: 1,
    percentAnswered: 100,
  });
});
