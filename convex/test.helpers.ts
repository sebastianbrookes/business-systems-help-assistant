/// <reference types="vite/client" />
// Shared test setup. The two dots in the file name keep Convex from deploying it.
import { convexTest } from "convex-test";
import { afterEach, beforeEach, vi } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { loadArticlesAndNotes } from "./seed";

const modules = import.meta.glob("./**/*.ts");

/** Stubs the OpenRouter key and clears stubs and fake clocks after each test. Call once per test file. */
export function useTestEnv() {
  beforeEach(() => vi.stubEnv("OPENROUTER_API_KEY", "test-key"));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
}

/** A test deployment loaded with all the starting data, history included. */
export async function setupWithHistory() {
  const t = convexTest(schema, modules);
  await t.mutation(internal.seed.load);
  return t;
}

/** A test deployment with only the starting Help articles and IT team notes. */
export async function setup() {
  const t = convexTest(schema, modules);
  await t.run(loadArticlesAndNotes);
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
export function fakeModelReply(...contents: unknown[]) {
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

/** The text of every message sent in one faked OpenRouter call. */
export function promptOf(fetch: ReturnType<typeof fakeModelReply>, call = 0) {
  const { messages } = JSON.parse(String(fetch.mock.calls[call][1]?.body));
  return messages.map((m: { content: string }) => m.content).join("\n");
}
