// Scores Test set results with no AI grading.

import type { Doc } from "../../convex/_generated/dataModel";
import { PLACEHOLDER, placeholdersIn } from "../../convex/placeholders";
import { KNOWN_GAPS, type AnswerKey, type KnownGap } from "./questions";

/** What the assistant did, or "error" if asking failed. */
export type Result = {
  outcome: Doc<"questions">["outcome"] | "error";
  answer: string;
  citedArticles: string[];
  gapReason?: Doc<"questions">["gapReason"];
  /** The title of the starting Gap group the question joined. */
  gapGroup?: string;
  /** The title of a new Gap group the question started for its Visitor. */
  newGapGroup?: string;
};

/**
 * A Fill from IT notes run on a Known gap's draft: the values it put in and
 * the placeholders left, or the error it hit.
 */
export type FillCheck = {
  knownGap: KnownGap;
  filled: string[];
  placeholdersLeft: number;
  error?: string;
};

export type Ratio = { count: number; total: number };
export type Score = {
  correctArticle: Ratio;
  knownGapsFlagged: Ratio;
  correctGapReason: Ratio;
  falseAlarms: Ratio;
  offTopicDeclined: Ratio;
  gapsGrouped: Ratio;
  fillFromNotes: Ratio;
};

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

const ratio = <T>(items: T[], counts: (item: T) => boolean): Ratio => ({
  count: items.filter(counts).length,
  total: items.length,
});

/**
 * Scores a run's questions and its Fill from IT notes checks. Correct Gap
 * reason counts only flagged Known gap questions. A Known gap is grouped
 * correctly when all its phrasings join its starting group from the history.
 */
export function score(
  rows: { expected: AnswerKey; result: Result }[],
  fillChecks: { pass: boolean }[],
): Score {
  const asked = (outcome: AnswerKey["outcome"]) =>
    rows.filter((r) => r.expected.outcome === outcome);
  const knownGapRows = rows.flatMap(({ expected, result }) =>
    expected.outcome === "gap" ? [{ knownGap: expected.knownGap, result }] : [],
  );
  const flagged = knownGapRows.filter((r) => r.result.outcome === "gap");
  return {
    correctArticle: ratio(asked("answered"), (r) => passes(r.expected, r.result)),
    knownGapsFlagged: ratio(asked("gap"), (r) => passes(r.expected, r.result)),
    correctGapReason: ratio(
      flagged,
      (r) => r.result.gapReason === KNOWN_GAPS[r.knownGap].reason,
    ),
    falseAlarms: ratio(asked("answered"), (r) => r.result.outcome === "gap"),
    offTopicDeclined: ratio(asked("offTopic"), (r) => passes(r.expected, r.result)),
    gapsGrouped: ratio([...new Set(knownGapRows.map((r) => r.knownGap))], (k) =>
      knownGapRows
        .filter((r) => r.knownGap === k)
        .every((r) => r.result.outcome === "gap" && r.result.gapGroup === KNOWN_GAPS[k].group),
    ),
    fillFromNotes: ratio(fillChecks, (c) => c.pass),
  };
}

const rate = ({ count, total }: Ratio) => count / total;

/**
 * Each measure's worst across the runs: the lowest score, or the highest
 * false-alarm rate. A run where a measure counted nothing is left out of it.
 */
export const worst = (scores: Score[]): Score =>
  Object.fromEntries(
    (Object.keys(scores[0]) as (keyof Score)[]).map((key) => {
      const ratios = scores.map((s) => s[key]);
      const counted = ratios.filter((r) => r.total);
      return [
        key,
        (counted.length ? counted : ratios).reduce((w, r) =>
          (key === "falseAlarms" ? rate(r) > rate(w) : rate(r) < rate(w)) ? r : w,
        ),
      ];
    }),
  ) as Score;

/** What replaced each placeholder in `before` to give `after`, leaving out placeholders still there. */
export function filledValues(before: string, after: string) {
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = before.split(PLACEHOLDER).map(escape).join("([\\s\\S]*?)");
  const match = after.match(new RegExp(`^${pattern}$`));
  if (!match) throw new Error("The fill changed more than its placeholders.");
  const placeholders = placeholdersIn(before);
  return [
    ...new Set(match.slice(1).filter((value, i) => value !== placeholders[i])),
  ];
}

// Function words a fill may add when it fits a fact into its sentence.
// Negations aren't among them.
const FUNCTION_WORDS = new Set(
  `a an the and or of to in on at by for with from as is are be it its if
  you your they them their which that this who can will must need should may`.split(/\s+/),
);
const words = (text: string) =>
  (text.toLowerCase().match(/\d+|[a-z]+/g) ?? []).filter((w) => !FUNCTION_WORDS.has(w));

/** Whether one note has every number and content word in the value. A fact reworded beyond function words fails. */
const backedByNotes = (value: string, notes: string[]) =>
  notes.some((note) => {
    const noteWords = new Set(words(note));
    return words(value).every((w) => noteWords.has(w));
  });

/**
 * For a hole the notes cover, passes when something is filled and every
 * filled value comes from the notes. For one they don't, passes when nothing
 * is filled and placeholders are left for the IT team.
 */
export const fillPasses = (
  { knownGap, filled, placeholdersLeft, error }: FillCheck,
  notes: string[],
) =>
  !error &&
  ("notInNotes" in KNOWN_GAPS[knownGap]
    ? !filled.length && placeholdersLeft > 0
    : filled.length > 0 && filled.every((value) => backedByNotes(value, notes)));
