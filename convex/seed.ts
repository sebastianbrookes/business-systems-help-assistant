import type { Id } from "./_generated/dataModel";
import { internalMutation, type MutationCtx } from "./_generated/server";
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
  for (const { cited, gapGroup, ...suggested } of suggestedQuestions) {
    await ctx.db.insert("suggestedQuestions", {
      ...suggested,
      citedArticleIds: cited.map(articleId),
      gapGroupId: await groupId(gapGroup),
    });
  }
}

