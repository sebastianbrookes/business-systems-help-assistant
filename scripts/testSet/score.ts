// Scores Test set results with no AI grading.

import type { Doc } from "../../convex/_generated/dataModel";
import type { AnswerKey } from "./questions";

/** What the assistant did, or "error" if asking failed. */
export type Result = {
  outcome: Doc<"questions">["outcome"] | "error";
  answer: string;
  citedArticles: string[];
  gapReason?: Doc<"questions">["gapReason"];
  gapGroupId?: string;
};

export type Ratio = { passed: number; total: number };
export type Score = { correctArticle: Ratio; knownGapsFlagged: Ratio };

/**
 * Correct article: an acceptable article is cited and no Gap is logged.
 * Known gaps flagged: a Gap with any reason. Off topic: declined.
 */
export function passes(expected: AnswerKey, result: Result) {
  switch (expected.outcome) {
    case "answered":
      return (
        result.outcome === "answered" &&
        result.citedArticles.some((a) => expected.articles.includes(a))
      );
    case "gap":
      return result.outcome === "gap";
    case "offTopic":
      return result.outcome === "offTopic";
  }
}

export function score(rows: { expected: AnswerKey; result: Result }[]): Score {
  const ratio = (outcome: AnswerKey["outcome"]) => {
    const asked = rows.filter((r) => r.expected.outcome === outcome);
    return {
      passed: asked.filter((r) => passes(r.expected, r.result)).length,
      total: asked.length,
    };
  };
  return {
    correctArticle: ratio("answered"),
    knownGapsFlagged: ratio("gap"),
  };
}

const lowestRatio = (ratios: Ratio[]) =>
  ratios.reduce((low, r) =>
    r.passed / r.total < low.passed / low.total ? r : low,
  );

/** Each number's lowest score across the runs. */
export const lowest = (scores: Score[]): Score => ({
  correctArticle: lowestRatio(scores.map((s) => s.correctArticle)),
  knownGapsFlagged: lowestRatio(scores.map((s) => s.knownGapsFlagged)),
});
