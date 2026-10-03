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

const literals = <T extends string>(values: readonly [T, T, ...T[]]) =>
  v.union(...values.map((value) => v.literal(value)));

const department = literals(DEPARTMENTS);
const system = literals(SYSTEMS);

export default defineSchema({
  helpArticles: defineTable({
    title: v.string(),
    department,
    system,
    contactTeam: v.string(),
    body: v.string(),
  }),
  itTeamNotes: defineTable({
    text: v.string(),
  }),
  questions: defineTable({
    visitorId: v.string(),
    text: v.string(),
    answer: v.string(),
    citedArticleIds: v.array(v.id("helpArticles")),
    outcome: literals(OUTCOMES),
    gapReason: v.optional(literals(GAP_REASONS)),
    department: v.optional(department),
    system: v.optional(system),
  }).index("by_visitor", ["visitorId"]),
});
