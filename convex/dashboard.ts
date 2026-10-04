import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { groupDraft } from "./gapGroups";
import { DAY_MS, happenedAt } from "./history";
import { SYSTEMS } from "./schema";
import { startingAndOwnQuestions, visibleGroups } from "./visibility";

const WINDOW_MS = 30 * DAY_MS;

/** Whether the Help articles answered the question. Didn't help makes an answered question a Gap. */
const isAnswered = (q: Doc<"questions">) =>
  q.outcome === "answered" && !q.didntHelp;

/**
 * The IT team's Dashboard, from starting data plus the Visitor's own rows.
 * Question counts cover the last 30 days and leave out Off topic and paused
 * questions, so every counted question was answered or is a Gap. The chart
 * puts questions not tagged with a system in a last "No system" bar.
 */
export const get = query({
  args: { visitorId: v.string() },
  handler: async (ctx, { visitorId }) => {
    const since = Date.now() - WINDOW_MS;
    const questions = (await startingAndOwnQuestions(ctx, visitorId)).filter(
      (q) =>
        (q.outcome === "answered" || q.outcome === "gap") &&
        happenedAt(q) >= since,
    );
    const answered = questions.filter(isAnswered).length;

    const states = await Promise.all(
      (await visibleGroups(ctx, visitorId)).map(
        async (g) => (await groupDraft(ctx, visitorId, g._id)).state,
      ),
    );

    const bar = (system: string, asked: Doc<"questions">[]) => {
      const answeredHere = asked.filter(isAnswered).length;
      return {
        system,
        answered: answeredHere,
        gap: asked.length - answeredHere,
        total: asked.length,
      };
    };
    const bySystem = SYSTEMS.map((system) =>
      bar(system, questions.filter((q) => q.system === system)),
    ).sort((a, b) => b.total - a.total);
    const untagged = questions.filter((q) => q.system === undefined);
    if (untagged.length) bySystem.push(bar("No system", untagged));

    return {
      questionsLast30Days: questions.length,
      percentAnswered: questions.length
        ? Math.round((100 * answered) / questions.length)
        : null,
      openGroups: states.filter((s) => s === "open").length,
      resolvedGroups: states.filter((s) => s === "resolved").length,
      bySystem,
    };
  },
});
