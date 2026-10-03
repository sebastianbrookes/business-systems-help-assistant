import { internalMutation } from "./_generated/server";
import { sampleArticles } from "./sampleArticles";

/** Loads the starting Help articles once. Run with `npx convex run seed:load`. */
export const load = internalMutation({
  args: {},
  handler: async (ctx) => {
    if (await ctx.db.query("helpArticles").first()) return;
    for (const article of sampleArticles) {
      await ctx.db.insert("helpArticles", article);
    }
  },
});
