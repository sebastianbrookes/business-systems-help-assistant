import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  action,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import { answerAndTag } from "./answerAndTag";
import schema from "./schema";

const MAX_QUESTION_LENGTH = 500;

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
    return await ctx.runMutation(internal.questions.save, {
      visitorId,
      text,
      ...result,
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

export const save = internalMutation({
  args: schema.tables.questions.validator,
  handler: (ctx, question) => ctx.db.insert("questions", question),
});
