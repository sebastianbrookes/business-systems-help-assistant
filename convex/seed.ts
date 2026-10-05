import type { Id, TableNames } from "./_generated/dataModel";
import { internalMutation, type MutationCtx } from "./_generated/server";
import schema from "./schema";
import { startingArticles } from "./startingArticles";
import { approvedRef, startingGapGroups } from "./startingGapGroups";
import { startingQuestions, suggestedQuestions } from "./startingHistory";
import { startingItTeamNotes } from "./startingItTeamNotes";

/**
 * Loads the starting data, skipping any part already loaded. It makes no AI
 * calls. Run with `pnpm exec convex run seed:load`.
 */
export const load = internalMutation({
  args: {},
  handler: async (ctx) => {
    if (!(await ctx.db.query("helpArticles").first())) {
      await loadArticlesAndNotes(ctx);
    }
    if (!(await ctx.db.query("suggestedQuestions").first())) {
      await loadHistory(ctx);
    }
  },
});

/**
 * Deletes everything, every Visitor's activity included, and loads a fresh copy
 * of the starting data, for a Test set run. It runs only on a deployment whose
 * ALLOW_SEED_RELOAD environment variable is "true".
 */
export const reload = internalMutation({
  args: {},
  handler: async (ctx) => {
    if (process.env.ALLOW_SEED_RELOAD !== "true") {
      throw new Error(
        'Reload deletes everything, so it needs ALLOW_SEED_RELOAD set to "true".',
      );
    }
    for (const table of Object.keys(schema.tables) as TableNames[]) {
      for (const { _id } of await ctx.db.query(table).collect()) {
        await ctx.db.delete(_id);
      }
    }
    await loadArticlesAndNotes(ctx);
    await loadHistory(ctx);
  },
});

/**
 * Replaces the Suggested questions with the ones in startingHistory.ts and
 * leaves everything else, for a deployment loaded before they changed. Run
 * with `pnpm exec convex run seed:replaceSuggested`.
 */
export const replaceSuggested = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const { _id } of await ctx.db.query("suggestedQuestions").collect()) {
      await ctx.db.delete(_id);
    }
    await loadSuggested(ctx);
  },
});

export async function loadArticlesAndNotes(ctx: MutationCtx) {
  for (const article of startingArticles) {
    await ctx.db.insert("helpArticles", article);
  }
  for (const note of startingItTeamNotes) {
    await ctx.db.insert("itTeamNotes", note);
  }
}

/** Loads the starting Gap groups, their drafts, the question history, and the Suggested questions. */
async function loadHistory(ctx: MutationCtx) {
  const articleIds = new Map<string, Id<"helpArticles">>();
  const starting = await ctx.db
    .query("helpArticles")
    .withIndex("by_visitor", (q) => q.eq("visitorId", undefined))
    .collect();
  for (const { _id, title, revisesArticleId } of starting) {
    if (!revisesArticleId) articleIds.set(title, _id);
  }
  const articleId = (ref: string) => {
    const id = articleIds.get(ref);
    if (!id) throw new Error(`No starting article for "${ref}"`);
    return id;
  };

  const groupIds = new Map<string, Id<"gapGroups">>();
  for (const { title, revises, draft } of startingGapGroups) {
    const revisesArticleId = revises ? articleId(revises) : undefined;
    const gapGroupId = await ctx.db.insert("gapGroups", {
      title,
      revisesArticleId,
    });
    groupIds.set(title, gapGroupId);
    if (!draft) continue;
    const { status, daysAgo, ...article } = draft;
    let approvedArticleId: Id<"helpArticles"> | undefined;
    if (status === "approved") {
      approvedArticleId = await ctx.db.insert("helpArticles", {
        ...article,
        revisesArticleId,
      });
      articleIds.set(approvedRef(title), approvedArticleId);
    }
    await ctx.db.insert("draftArticles", {
      gapGroupId,
      ...draft,
      articleId: approvedArticleId,
    });
  }
  /** The starting group with this title, starting it if it's one of the history's small groups. */
  const groupId = async (title: string | undefined) => {
    if (title === undefined) return undefined;
    let id = groupIds.get(title);
    if (!id) {
      id = await ctx.db.insert("gapGroups", { title });
      groupIds.set(title, id);
    }
    return id;
  };

  for (const { cited, gapGroup, ...question } of startingQuestions) {
    await ctx.db.insert("questions", {
      ...question,
      citedArticleIds: cited.map(articleId),
      gapGroupId: await groupId(gapGroup),
    });
  }
  await loadSuggested(ctx);
}

/** Loads the Suggested questions, which cite starting articles and join starting Gap groups. */
async function loadSuggested(ctx: MutationCtx) {
  const articles = await ctx.db
    .query("helpArticles")
    .withIndex("by_visitor", (q) => q.eq("visitorId", undefined))
    .collect();
  const groups = await ctx.db
    .query("gapGroups")
    .withIndex("by_visitor", (q) => q.eq("visitorId", undefined))
    .collect();
  const idOf = <T>(rows: { _id: T; title: string }[], title: string) => {
    const row = rows.find((r) => r.title === title);
    if (!row) throw new Error(`No starting article or Gap group for "${title}"`);
    return row._id;
  };
  const originals = articles.filter((a) => !a.revisesArticleId);

  for (const { cited, gapGroup, ...suggested } of suggestedQuestions) {
    await ctx.db.insert("suggestedQuestions", {
      ...suggested,
      citedArticleIds: cited.map((title) => idOf(originals, title)),
      gapGroupId: gapGroup === undefined ? undefined : idOf(groups, gapGroup),
    });
  }
}

