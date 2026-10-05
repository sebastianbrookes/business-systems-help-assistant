import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalQuery,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import type { Grouping } from "./groupGap";
import { happenedAt } from "./history";
import {
  isVisible,
  startingAndOwnQuestions,
  visibleGroups,
} from "./visibility";

export async function visibleGroup(
  ctx: QueryCtx,
  visitorId: string,
  gapGroupId: Id<"gapGroups">,
) {
  const group = await ctx.db.get(gapGroupId);
  if (!group || !isVisible(group, visitorId)) {
    throw new ConvexError("Gap group not found.");
  }
  return group;
}

export async function visibleQuestions(
  ctx: QueryCtx,
  visitorId: string,
  gapGroupId: Id<"gapGroups">,
) {
  const questions = await ctx.db
    .query("questions")
    .withIndex("by_gap_group", (q) => q.eq("gapGroupId", gapGroupId))
    .collect();
  return questions.filter((q) => isVisible(q, visitorId));
}

/** A Gap shown to the IT team. A Didn't help question includes the answer it got. */
export const gapView = (q: Doc<"questions">) => ({
  text: q.text,
  gapReason: q.didntHelp ? ("didntHelp" as const) : q.gapReason,
  answer: q.didntHelp ? q.answer : undefined,
});

/**
 * The group's state for the Visitor, and the draft they see: their own if they
 * have one, or else a starting draft.
 */
export async function groupDraft(
  ctx: QueryCtx,
  visitorId: string,
  gapGroupId: Id<"gapGroups">,
) {
  const drafts = (
    await ctx.db
      .query("draftArticles")
      .withIndex("by_gap_group", (q) => q.eq("gapGroupId", gapGroupId))
      .collect()
  ).filter((d) => isVisible(d, visitorId));
  const state = drafts.some((d) => d.status === "approved")
    ? ("resolved" as const)
    : drafts.length
      ? ("drafted" as const)
      : ("open" as const);
  const draft = drafts.find((d) => d.visitorId === visitorId) ?? drafts[0];
  return { state, draft: draft ?? null };
}

const STATE_ORDER = { drafted: 0, open: 1, resolved: 2 } as const;

/**
 * The Visitor's Gap groups: Drafted (only approval left), then Open, then
 * Resolved, each most-asked first. Counts are starting questions plus the
 * Visitor's own. A group's ownDraft is whether its draft is the Visitor's: one
 * they drafted, edited, or approved.
 */
export const list = query({
  args: { visitorId: v.string() },
  handler: async (ctx, { visitorId }) => {
    const groups = await Promise.all(
      (await visibleGroups(ctx, visitorId)).map(async (g) => {
        const { state, draft } = await groupDraft(ctx, visitorId, g._id);
        const questions = await visibleQuestions(ctx, visitorId, g._id);
        return {
          _id: g._id,
          title: g.title,
          state,
          questionCount: questions.length,
          includesYours: questions.some((q) => q.visitorId === visitorId),
          ownDraft: draft?.visitorId === visitorId,
        };
      }),
    );
    return groups.sort(
      (a, b) =>
        STATE_ORDER[a.state] - STATE_ORDER[b.state] ||
        b.questionCount - a.questionCount,
    );
  },
});

/**
 * One Gap group with its questions, their Gap reasons and dates, its state, and
 * the Visitor's draft. A Resolved group also shows when it was approved and the
 * questions answered from its article since.
 */
export const get = query({
  args: { visitorId: v.string(), gapGroupId: v.id("gapGroups") },
  handler: async (ctx, { visitorId, gapGroupId }) => {
    const group = await visibleGroup(ctx, visitorId, gapGroupId);
    const questions = await visibleQuestions(ctx, visitorId, gapGroupId);
    const { state, draft } = await groupDraft(ctx, visitorId, gapGroupId);
    const articleId = state === "resolved" ? draft?.articleId : undefined;
    const article = articleId ? await ctx.db.get(articleId) : null;
    const answeredAfter = articleId
      ? (await startingAndOwnQuestions(ctx, visitorId)).filter(
          (q) => q.outcome === "answered" && q.citedArticleIds.includes(articleId),
        )
      : [];
    return {
      _id: group._id,
      title: group.title,
      questions: questions.map((q) => ({
        _id: q._id,
        ...gapView(q),
        askedAt: happenedAt(q),
      })),
      revisesArticle: group.revisesArticleId
        ? { title: (await ctx.db.get(group.revisesArticleId))!.title }
        : null,
      state,
      draft,
      approvedAt: article
        ? // A starting draft stores when it was approved. A Visitor's approval made the article.
          happenedAt({ daysAgo: draft!.daysAgo, _creationTime: article._creationTime })
        : null,
      answeredAfter: answeredAfter.map((q) => ({
        _id: q._id,
        text: q.text,
        askedAt: happenedAt(q),
      })),
    };
  },
});

/** The groups a new Gap can join: the Visitor's visible groups that aren't Resolved. */
export const joinable = internalQuery({
  args: { visitorId: v.string() },
  handler: async (ctx, { visitorId }): Promise<Doc<"gapGroups">[]> => {
    const groups = await visibleGroups(ctx, visitorId);
    const states = await Promise.all(
      groups.map(async (g) => (await groupDraft(ctx, visitorId, g._id)).state),
    );
    return groups.filter((_, i) => states[i] !== "resolved");
  },
});

/**
 * Returns the Gap group a grouping chose, starting it for the Visitor if it's
 * new. A new group started by Didn't help revises the article that didn't help.
 */
export async function placeInGroup(
  ctx: MutationCtx,
  visitorId: string,
  grouping: Grouping,
  revisesArticleId?: Id<"helpArticles">,
): Promise<Id<"gapGroups">> {
  if ("gapGroupId" in grouping) return grouping.gapGroupId;
  return ctx.db.insert("gapGroups", {
    visitorId,
    title: grouping.newGroupTitle,
    revisesArticleId,
  });
}
