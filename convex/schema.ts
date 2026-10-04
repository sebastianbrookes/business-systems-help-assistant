import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const DEPARTMENTS = ["Finance", "HR", "Legal", "Ops", "IT"] as const;
export const SYSTEMS = [
  "Coupa",
  "Concur",
  "Workday",
  "Ironclad",
  "ServiceNow",
  "Microsoft 365",
] as const;

export const OUTCOMES = ["answered", "gap", "offTopic"] as const;
export const GAP_REASONS = ["noMatch", "notCovered"] as const;
export const DRAFT_STATUSES = ["pending", "approved"] as const;

const literals = <T extends string>(values: readonly [T, T, ...T[]]) =>
  v.union(...values.map((value) => v.literal(value)));

const department = literals(DEPARTMENTS);
const system = literals(SYSTEMS);

export const articleFields = {
  title: v.string(),
  department,
  system,
  contactTeam: v.string(),
  body: v.string(),
};

/** What the assistant did with a question, saved on it or on a Suggested question. */
const resultFields = {
  answer: v.string(),
  citedArticleIds: v.array(v.id("helpArticles")),
  outcome: literals(OUTCOMES),
  gapReason: v.optional(literals(GAP_REASONS)),
  department: v.optional(department),
  system: v.optional(system),
  gapGroupId: v.optional(v.id("gapGroups")),
};

// Rows with no visitorId are starting data, seen by every Visitor. Starting
// history stores daysAgo instead of a date, so it always ends today.
export default defineSchema({
  helpArticles: defineTable({
    visitorId: v.optional(v.string()),
    ...articleFields,
    // A revision replaces this article for whoever can see the revision.
    revisesArticleId: v.optional(v.id("helpArticles")),
  }).index("by_visitor", ["visitorId"]),
  itTeamNotes: defineTable({
    text: v.string(),
  }),
  questions: defineTable({
    visitorId: v.optional(v.string()),
    text: v.string(),
    ...resultFields,
    // Paused: a limit was hit or OpenRouter was out of credit, so the answer is the paused message.
    outcome: literals([...OUTCOMES, "paused"]),
    // Set when the Employee clicks Didn't help. The outcome stays answered.
    didntHelp: v.optional(v.boolean()),
    daysAgo: v.optional(v.number()),
  })
    .index("by_visitor", ["visitorId"])
    .index("by_gap_group", ["gapGroupId"]),
  gapGroups: defineTable({
    visitorId: v.optional(v.string()),
    title: v.string(),
    // Set for a revision group: its Draft article revises this article.
    revisesArticleId: v.optional(v.id("helpArticles")),
  }).index("by_visitor", ["visitorId"]),
  draftArticles: defineTable({
    visitorId: v.optional(v.string()),
    gapGroupId: v.id("gapGroups"),
    ...articleFields,
    status: literals(DRAFT_STATUSES),
    // The Help article an approved draft became.
    articleId: v.optional(v.id("helpArticles")),
    // For a starting approved draft, when it was approved.
    daysAgo: v.optional(v.number()),
  }).index("by_gap_group", ["gapGroupId"]),
  // Each has a saved result, so asking one makes no AI call.
  suggestedQuestions: defineTable({
    text: v.string(),
    hint: v.string(),
    ...resultFields,
  }),
  // AI calls per UTC day ("2026-10-04"): a Visitor's, or the whole app's with no visitorId.
  usageCounters: defineTable({
    day: v.string(),
    visitorId: v.optional(v.string()),
    calls: v.number(),
  }).index("by_day_visitor", ["day", "visitorId"]),
});
