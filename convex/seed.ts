import { internalMutation } from "./_generated/server";
import { startingArticles } from "./startingArticles";
import { startingItTeamNotes } from "./startingItTeamNotes";

/** Loads the starting data once. Run with `pnpm exec convex run seed:load`. */
export const load = internalMutation({
  args: {},
  handler: async (ctx) => {
    if (await ctx.db.query("helpArticles").first()) return;
    for (const article of startingArticles) {
      await ctx.db.insert("helpArticles", article);
    }
    for (const note of startingItTeamNotes) {
      await ctx.db.insert("itTeamNotes", note);
    }
  },
});
