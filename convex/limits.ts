import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { type ActionCtx, internalMutation, type MutationCtx } from "./_generated/server";
import { PausedError } from "./openrouter";

const VISITOR_DAILY_LIMIT = 15;
const APP_DAILY_LIMIT = 250;

/** The usage counter for the Visitor, or for the whole app with no Visitor ID, on a UTC day. */
const counter = (ctx: MutationCtx, day: string, visitorId?: string) =>
  ctx.db
    .query("usageCounters")
    .withIndex("by_day_visitor", (q) => q.eq("day", day).eq("visitorId", visitorId))
    .unique();

/** Counts one AI call for the Visitor and the app today. Returns false, counting nothing, if either is at its limit. */
export const countIfUnderLimits = internalMutation({
  args: { visitorId: v.string() },
  handler: async (ctx, { visitorId }) => {
    const day = new Date().toISOString().slice(0, 10);
    const visitor = await counter(ctx, day, visitorId);
    const app = await counter(ctx, day);
    if (
      (visitor?.calls ?? 0) >= VISITOR_DAILY_LIMIT ||
      (app?.calls ?? 0) >= APP_DAILY_LIMIT
    ) {
      return false;
    }
    const bump = (row: Doc<"usageCounters"> | null, visitorId?: string) =>
      row
        ? ctx.db.patch(row._id, { calls: row.calls + 1 })
        : ctx.db.insert("usageCounters", { day, visitorId, calls: 1 });
    await bump(visitor, visitorId);
    await bump(app);
    return true;
  },
});

/** Counts one AI call for the Visitor, or throws a PausedError if a limit is hit. */
export async function countAiCall(ctx: ActionCtx, visitorId: string) {
  if (!(await ctx.runMutation(internal.limits.countIfUnderLimits, { visitorId }))) {
    throw new PausedError();
  }
}
