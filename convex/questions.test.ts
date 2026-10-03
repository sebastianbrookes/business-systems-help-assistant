/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

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
  return { t, articleId };
}

/** Fakes OpenRouter replying with `content` as the model's message. */
function fakeModelReply(content: unknown) {
  const fetch = vi.fn(async () =>
    Response.json({
      choices: [
        {
          message: {
            content:
              typeof content === "string" ? content : JSON.stringify(content),
          },
        },
      ],
    }),
  );
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
  fakeModelReply(reply);

  await expect(
    t.action(api.questions.ask, { visitorId, text: "How do I buy gloves?" }),
  ).rejects.toThrow(/unusable reply/);

  expect(await t.query(api.questions.list, { visitorId })).toEqual([]);
});
