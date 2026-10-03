import { internalMutation } from "./_generated/server";
import { startingArticles } from "./startingArticles";

/** Loads the starting Help articles once. Run with `npx convex run seed:load`. */
export const load = internalMutation({
  args: {},
  handler: async (ctx) => {
    if (await ctx.db.query("helpArticles").first()) return;
    for (const article of startingArticles) {
      await ctx.db.insert("helpArticles", article);
    }
  },
});
