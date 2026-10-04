import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalQuery,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import type { Grouping } from "./groupGap";

/** Whether a row is starting data or the Visitor's own. */
const isVisible = (row: { visitorId?: string }, visitorId: string) =>
  row.visitorId === undefined || row.visitorId === visitorId;

async function visibleGroups(ctx: QueryCtx, visitorId: string) {
  const byVisitor = (id: string | undefined) =>
    ctx.db
      .query("gapGroups")
      .withIndex("by_visitor", (q) => q.eq("visitorId", id))
      .collect();
  return [...(await byVisitor(undefined)), ...(await byVisitor(visitorId))];
}

async function visibleQuestions(
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

/** The Visitor's Gap groups, most-asked first. Counts are starting questions plus the Visitor's own. */
export const list = query({
  args: { visitorId: v.string() },
  handler: async (ctx, { visitorId }) => {
    const groups = await Promise.all(
      (await visibleGroups(ctx, visitorId)).map(async (g) => ({
        _id: g._id,
        title: g.title,
        questionCount: (await visibleQuestions(ctx, visitorId, g._id)).length,
      })),
    );
    return groups.sort((a, b) => b.questionCount - a.questionCount);
  },
});

/** One Gap group with its questions and their Gap reasons. A Didn't help question includes the answer it got. */
export const get = query({
  args: { visitorId: v.string(), gapGroupId: v.id("gapGroups") },
  handler: async (ctx, { visitorId, gapGroupId }) => {
    const group = await ctx.db.get(gapGroupId);
    if (!group || !isVisible(group, visitorId)) {
      throw new ConvexError("Gap group not found.");
    }
    const questions = await visibleQuestions(ctx, visitorId, gapGroupId);
    return {
      _id: group._id,
      title: group.title,
      questions: questions.map((q) => ({
        _id: q._id,
        text: q.text,
        gapReason: q.didntHelp ? ("didntHelp" as const) : q.gapReason,
        answer: q.didntHelp ? q.answer : undefined,
      })),
    };
  },
});

export const visible = internalQuery({
  args: { visitorId: v.string() },
  handler: (ctx, { visitorId }): Promise<Doc<"gapGroups">[]> =>
    visibleGroups(ctx, visitorId),
});

/** Returns the Gap group a grouping chose, starting it for the Visitor if it's new. */
export async function placeInGroup(
  ctx: MutationCtx,
  visitorId: string,
  grouping: Grouping,
): Promise<Id<"gapGroups">> {
  if ("gapGroupId" in grouping) return grouping.gapGroupId;
  return ctx.db.insert("gapGroups", {
    visitorId,
    title: grouping.newGroupTitle,
  });
}
