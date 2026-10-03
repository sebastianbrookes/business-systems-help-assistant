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

export const department = v.union(...DEPARTMENTS.map((d) => v.literal(d)));
export const system = v.union(...SYSTEMS.map((s) => v.literal(s)));

export default defineSchema({
  helpArticles: defineTable({
    title: v.string(),
    department,
    system,
    contactTeam: v.string(),
    body: v.string(),
  }),
  questions: defineTable({
    visitorId: v.string(),
    text: v.string(),
    answer: v.string(),
    citedArticleIds: v.array(v.id("helpArticles")),
    outcome: v.union(
      v.literal("answered"),
      v.literal("gap"),
      v.literal("offTopic"),
    ),
    gapReason: v.optional(
      v.union(v.literal("noMatch"), v.literal("notCovered")),
    ),
    department: v.optional(department),
    system: v.optional(system),
  }).index("by_visitor", ["visitorId"]),
});
