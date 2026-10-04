import { ConvexError, v } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import {
  gapView,
  groupDraft,
  visibleGroup,
  visibleQuestions,
} from "./gapGroups";
import { fillFromNotes } from "./fillFromNotes";
import { placeholdersIn } from "./placeholders";
import { articleFields } from "./schema";
import { currentVersion, visibleArticles } from "./visibility";
import { writeDraft } from "./writeDraft";

const MAX_TITLE_LENGTH = 120;
const MAX_BODY_LENGTH = 5000;

/** For a revision group, the version of the revised article the Visitor sees now. */
const revisedVersion = async (
  ctx: QueryCtx,
  visitorId: string,
  group: Doc<"gapGroups">,
) =>
  group.revisesArticleId
    ? currentVersion(ctx, visitorId, group.revisesArticleId)
    : null;

/** Throws unless the group is Open for the Visitor, the only state a new draft can start from. */
async function requireOpen(
  ctx: QueryCtx,
  visitorId: string,
  gapGroupId: Id<"gapGroups">,
) {
  if ((await groupDraft(ctx, visitorId, gapGroupId)).state !== "open") {
    throw new ConvexError("This Gap group already has a Draft article.");
  }
}

/** Has the AI write the Draft article for a Gap group, which opens under the group. */
export const draft = action({
  args: { visitorId: v.string(), gapGroupId: v.id("gapGroups") },
  handler: async (ctx, { visitorId, gapGroupId }) => {
    const input = await ctx.runQuery(internal.draftArticles.draftInput, {
      visitorId,
      gapGroupId,
    });
    await ctx.runMutation(internal.draftArticles.insert, {
      visitorId,
      gapGroupId,
      article: await writeDraft(input),
    });
  },
});

export const draftInput = internalQuery({
  args: { visitorId: v.string(), gapGroupId: v.id("gapGroups") },
  handler: async (ctx, { visitorId, gapGroupId }) => {
    const group = await visibleGroup(ctx, visitorId, gapGroupId);
    await requireOpen(ctx, visitorId, gapGroupId);
    const questions = await visibleQuestions(ctx, visitorId, gapGroupId);
    const articles = await visibleArticles(ctx, visitorId);
    const articleToRevise = await revisedVersion(ctx, visitorId, group);
    const cited = new Set(questions.flatMap((q) => q.citedArticleIds));
    return {
      groupTitle: group.title,
      questions: questions.map(gapView),
      relatedArticles: articles.filter(
        (a) => cited.has(a._id) && a._id !== articleToRevise?._id,
      ),
      articleToRevise,
      contactTeams: [...new Set(articles.map((a) => a.contactTeam))],
    };
  },
});

export const insert = internalMutation({
  args: {
    visitorId: v.string(),
    gapGroupId: v.id("gapGroups"),
    article: v.object(articleFields),
  },
  handler: async (ctx, { visitorId, gapGroupId, article }) => {
    // A second click that raced the first doesn't add a second draft.
    await requireOpen(ctx, visitorId, gapGroupId);
    await ctx.db.insert("draftArticles", {
      visitorId,
      gapGroupId,
      ...article,
      status: "pending",
    });
  },
});

/** The pending draft the Visitor sees for a group, which may be a starting draft. */
async function pendingDraft(
  ctx: QueryCtx,
  visitorId: string,
  gapGroupId: Id<"gapGroups">,
) {
  const { state, draft } = await groupDraft(ctx, visitorId, gapGroupId);
  if (state !== "drafted" || !draft) {
    throw new ConvexError("This Gap group has no pending Draft article.");
  }
  return draft;
}

/**
 * The Visitor's pending draft for a group. A starting draft is copied to the
 * Visitor first, so their changes never reach anyone else.
 */
async function ownPendingDraft(
  ctx: MutationCtx,
  visitorId: string,
  gapGroupId: Id<"gapGroups">,
) {
  const draft = await pendingDraft(ctx, visitorId, gapGroupId);
  if (draft.visitorId === visitorId) return draft;
  const { _id, _creationTime, daysAgo, ...fields } = draft;
  const ownId = await ctx.db.insert("draftArticles", { ...fields, visitorId });
  return (await ctx.db.get(ownId))!;
}

/**
 * Fills the group's pending draft from the IT team notes, saves it as the
 * Visitor's own, and returns the filled title and body and how many
 * placeholders were filled.
 */
export const fill = action({
  args: { visitorId: v.string(), gapGroupId: v.id("gapGroups") },
  handler: async (
    ctx,
    { visitorId, gapGroupId },
  ): Promise<{ title: string; body: string; filledCount: number }> => {
    const input = await ctx.runQuery(internal.draftArticles.fillInput, {
      visitorId,
      gapGroupId,
    });
    const filled = await fillFromNotes(input);
    if (filled.filledCount) {
      await ctx.runMutation(api.draftArticles.save, {
        visitorId,
        gapGroupId,
        title: filled.title,
        body: filled.body,
      });
    }
    return filled;
  },
});

export const fillInput = internalQuery({
  args: { visitorId: v.string(), gapGroupId: v.id("gapGroups") },
  handler: async (ctx, { visitorId, gapGroupId }) => {
    await visibleGroup(ctx, visitorId, gapGroupId);
    const draft = await pendingDraft(ctx, visitorId, gapGroupId);
    const notes = await ctx.db.query("itTeamNotes").collect();
    return {
      title: draft.title,
      body: draft.body,
      notes: notes.map((n) => n.text),
    };
  },
});

/** Saves the Visitor's edits to a group's pending draft. */
export const save = mutation({
  args: {
    visitorId: v.string(),
    gapGroupId: v.id("gapGroups"),
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, { visitorId, gapGroupId, title, body }) => {
    title = title.trim();
    body = body.trim();
    if (!title || title.length > MAX_TITLE_LENGTH) {
      throw new ConvexError(`Titles must be 1–${MAX_TITLE_LENGTH} characters.`);
    }
    if (!body || body.length > MAX_BODY_LENGTH) {
      throw new ConvexError(`Articles must be 1–${MAX_BODY_LENGTH} characters.`);
    }
    const draft = await ownPendingDraft(ctx, visitorId, gapGroupId);
    await ctx.db.patch(draft._id, { title, body });
  },
});

/**
 * Approves a group's pending draft, which becomes a Help article in the
 * Visitor's view, replacing the article it revises. Rejected while any
 * placeholder remains.
 */
export const approve = mutation({
  args: { visitorId: v.string(), gapGroupId: v.id("gapGroups") },
  handler: async (
    ctx,
    { visitorId, gapGroupId },
  ): Promise<Id<"helpArticles">> => {
    const draft = await ownPendingDraft(ctx, visitorId, gapGroupId);
    const { title, department, system, contactTeam, body } = draft;
    if (placeholdersIn(`${title}\n${body}`).length) {
      throw new ConvexError(
        "Fill in every [Check: …] placeholder before approving.",
      );
    }
    const group = (await ctx.db.get(gapGroupId))!;
    const articleId = await ctx.db.insert("helpArticles", {
      title,
      department,
      system,
      contactTeam,
      body,
      visitorId,
      revisesArticleId: (await revisedVersion(ctx, visitorId, group))?._id,
    });
    await ctx.db.patch(draft._id, { status: "approved", articleId });
    return articleId;
  },
});
