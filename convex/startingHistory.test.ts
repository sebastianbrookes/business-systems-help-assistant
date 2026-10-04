import { expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import {
  fakeModelReply,
  setupWithHistory,
  useTestEnv,
} from "./test.helpers";

const visitorId = "visitor-1";
const DAY = 24 * 60 * 60 * 1000;
const SAMPLES = "Sending samples between Cambridge and Durham";

useTestEnv();

async function groupNamed(
  t: Awaited<ReturnType<typeof setupWithHistory>>,
  title: string,
) {
  const groups = await t.query(api.gapGroups.list, { visitorId });
  const { _id } = groups.find((g) => g.title === title)!;
  return t.query(api.gapGroups.get, { visitorId, gapGroupId: _id });
}

test("the starting data loads with no AI call", async () => {
  const fetch = fakeModelReply();
  const t = await setupWithHistory();
  expect(fetch).not.toHaveBeenCalled();

  const groups = await t.query(api.gapGroups.list, { visitorId });
  const open = groups.filter((g) => g.state === "open");
  expect(open.slice(0, 4).map((g) => g.title)).toEqual([
    SAMPLES,
    "Using AI tools with company files",
    "Moving MFA to a new phone",
    "Parking at the Durham site",
  ]);
  expect(open[0].questionCount).toBe(4);
  for (const g of open.slice(0, 4)) expect(g.questionCount).toBeGreaterThanOrEqual(4);
  // The remaining holes form small Open groups below the four main ones.
  expect(open.length).toBeGreaterThan(4);
  for (const g of open.slice(4)) expect(g.questionCount).toBeLessThanOrEqual(3);
  expect(groups.filter((g) => g.state !== "open")).toMatchObject([
    { title: "Carrying over unused time off", state: "drafted" },
    expect.objectContaining({ state: "resolved" }),
    expect.objectContaining({ state: "resolved" }),
  ]);
});

test("the MFA and time off groups revise their out-of-date articles", async () => {
  const t = await setupWithHistory();

  expect(await groupNamed(t, "Moving MFA to a new phone")).toMatchObject({
    state: "open",
    revisesArticle: { title: "Moving MFA to a new phone" },
  });
  expect(await groupNamed(t, "Carrying over unused time off")).toMatchObject({
    state: "drafted",
    revisesArticle: { title: "Requesting time off in Workday" },
    draft: {
      status: "pending",
      title: "Requesting time off in Workday",
      body: expect.stringContaining("[Check:"),
    },
  });
});

test.each([
  ["Laptop for a consultant", 21],
  ["Badge access", 14],
])(
  "the Resolved group %s shows Gaps before its approval and answered questions after",
  async (title, approvedDaysAgo) => {
    const t = await setupWithHistory();
    const now = Date.now();

    const group = await groupNamed(t, title);

    expect(group.state).toBe("resolved");
    expect(group.approvedAt).toBeCloseTo(now - approvedDaysAgo * DAY, -5);
    expect(group.questions.length).toBeGreaterThan(0);
    for (const q of group.questions) {
      expect(q.askedAt).toBeLessThan(group.approvedAt!);
    }
    expect(group.answeredAfter.length).toBeGreaterThan(0);
    for (const q of group.answeredAfter) {
      expect(q.askedAt).toBeGreaterThan(group.approvedAt!);
    }
  },
);

test("history is the 8 weeks ending today, and its dates move with today", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-04T12:00:00Z"));
  const t = await setupWithHistory();
  const askedAt = async () =>
    (await groupNamed(t, SAMPLES)).questions.map((q) => q.askedAt);
  const before = await askedAt();

  const later = new Date("2026-12-01T12:00:00Z").getTime();
  vi.setSystemTime(later);
  const after = await askedAt();

  const moved = later - new Date("2026-10-04T12:00:00Z").getTime();
  expect(after).toEqual(before.map((at) => at + moved));
  for (const at of after) {
    expect(at).toBeLessThanOrEqual(later);
    expect(at).toBeGreaterThan(later - 8 * 7 * DAY);
  }
});

test("the three Suggested questions use their saved answers and grouping, with no AI call", async () => {
  const t = await setupWithHistory();
  const fetch = fakeModelReply();

  const suggested = await t.query(api.questions.suggested, {});
  expect(suggested).toMatchObject([
    { text: "How do I order lab supplies from Fisher?", outcome: "answered" },
    {
      text: "Do I need an MTA to send samples to our Durham site?",
      outcome: "gap",
    },
    {
      text: "What's a good blocking buffer for a Western blot?",
      outcome: "offTopic",
    },
  ]);
  for (const s of suggested) expect(s.hint).toBeTruthy();
  for (const s of suggested) {
    await t.mutation(api.questions.askSuggested, {
      visitorId,
      suggestedQuestionId: s._id,
    });
  }

  expect(fetch).not.toHaveBeenCalled();
  expect(await t.query(api.questions.list, { visitorId })).toMatchObject([
    {
      outcome: "answered",
      citedArticles: [
        { title: "Ordering lab supplies through a Coupa punchout" },
      ],
    },
    { outcome: "gap", gapReason: expect.any(String) },
    { outcome: "offTopic", citedArticles: [] },
  ]);
  const samples = await groupNamed(t, SAMPLES);
  expect(samples.questions).toHaveLength(5);
  expect(samples.questions.at(-1)).toMatchObject({
    text: "Do I need an MTA to send samples to our Durham site?",
  });
  // Other Visitors' groups don't change.
  const other = await t.query(api.gapGroups.list, { visitorId: "visitor-2" });
  expect(other.find((g) => g.title === SAMPLES)).toMatchObject({
    questionCount: 4,
  });
});

test("Suggested questions keep working past the per-Visitor daily AI call limit", async () => {
  const t = await setupWithHistory();
  const fetch = fakeModelReply();
  const [, gap] = await t.query(api.questions.suggested, {});

  for (let i = 0; i < 20; i++) {
    await t.mutation(api.questions.askSuggested, {
      visitorId,
      suggestedQuestionId: gap._id,
    });
  }

  expect(fetch).not.toHaveBeenCalled();
  const questions = await t.query(api.questions.list, { visitorId });
  expect(questions).toHaveLength(20);
  for (const q of questions) expect(q.outcome).toBe("gap");
});
