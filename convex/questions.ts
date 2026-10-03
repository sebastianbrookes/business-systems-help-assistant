import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  action,
  type ActionCtx,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import { answerAndTag } from "./answerAndTag";
import { placeInGroup } from "./gapGroups";
import { groupGap, groupingValidator } from "./groupGap";
import schema from "./schema";

const MAX_QUESTION_LENGTH = 500;

/** Runs the grouping call against the Gap groups the Visitor can see. */
async function groupVisitorGap(
  ctx: ActionCtx,
  visitorId: string,
  gap: Parameters<typeof groupGap>[0],
) {
  const groups = await ctx.runQuery(internal.gapGroups.visible, { visitorId });
  return groupGap(gap, groups);
}

/** Answers a typed question and saves it for the Visitor. */
export const ask = action({
  args: { visitorId: v.string(), text: v.string() },
  handler: async (ctx, { visitorId, text }): Promise<Id<"questions">> => {
    text = text.trim();
    if (!text || text.length > MAX_QUESTION_LENGTH) {
      throw new ConvexError(
        `Questions must be 1–${MAX_QUESTION_LENGTH} characters.`,
      );
    }
    const articles = await ctx.runQuery(internal.questions.visibleArticles);
    const result = await answerAndTag(text, articles);
    // A Gap's grouping call is part of the same question.
    const grouping =
      result.outcome === "gap"
        ? await groupVisitorGap(ctx, visitorId, { text, ...result })
        : undefined;
    return await ctx.runMutation(internal.questions.save, {
      question: { visitorId, text, ...result },
      grouping,
    });
  },
});

/** Logs a Gap with the reason Didn't help for one of the Visitor's answered questions. */
export const didntHelp = action({
  args: { visitorId: v.string(), questionId: v.id("questions") },
  handler: async (ctx, { visitorId, questionId }) => {
    const question = await ctx.runQuery(
      internal.questions.ownAnsweredQuestion,
      { visitorId, questionId },
    );
    const grouping = await groupVisitorGap(ctx, visitorId, {
      ...question,
      gapReason: "didntHelp",
    });
    await ctx.runMutation(internal.questions.markDidntHelp, {
      visitorId,
      questionId,
      grouping,
    });
  },
});

/** The Visitor's questions, oldest first, with their cited articles. */
export const list = query({
  args: { visitorId: v.string() },
  handler: async (ctx, { visitorId }) => {
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();
    return Promise.all(
      questions.map(async ({ citedArticleIds, ...question }) => ({
        ...question,
        citedArticles: (
          await Promise.all(citedArticleIds.map((id) => ctx.db.get(id)))
        ).flatMap((a) =>
          a ? [{ _id: a._id, title: a.title, contactTeam: a.contactTeam }] : [],
        ),
      })),
    );
  },
});

export const visibleArticles = internalQuery({
  args: {},
  handler: (ctx) => ctx.db.query("helpArticles").collect(),
});

const { gapGroupId: _, ...questionFields } =
  schema.tables.questions.validator.fields;

export const save = internalMutation({
  args: {
    question: v.object({ ...questionFields, visitorId: v.string() }),
    grouping: v.optional(groupingValidator),
  },
  handler: async (ctx, { question, grouping }) =>
    ctx.db.insert("questions", {
      ...question,
      gapGroupId:
        grouping && (await placeInGroup(ctx, question.visitorId, grouping)),
    }),
});

export const ownAnsweredQuestion = internalQuery({
  args: { visitorId: v.string(), questionId: v.id("questions") },
  handler: async (ctx, { visitorId, questionId }) => {
    const question = await ctx.db.get(questionId);
    if (question?.visitorId !== visitorId || question.outcome !== "answered") {
      throw new ConvexError("Only your own answered questions can be marked.");
    }
    return question;
  },
});

export const markDidntHelp = internalMutation({
  args: {
    visitorId: v.string(),
    questionId: v.id("questions"),
    grouping: groupingValidator,
  },
  handler: async (ctx, { visitorId, questionId, grouping }) => {
    // A second click that raced the first changes nothing.
    if ((await ctx.db.get(questionId))?.outcome !== "answered") return;
    await ctx.db.patch(questionId, {
      outcome: "gap",
      gapReason: "didntHelp",
      gapGroupId: await placeInGroup(ctx, visitorId, grouping),
    });
  },
});
