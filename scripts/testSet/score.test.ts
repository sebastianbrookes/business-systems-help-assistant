import { expect, test } from "vitest";
import type { AnswerKey } from "./questions";
import {
  filledValues,
  fillPasses,
  passes,
  score,
  worst,
  type Result,
  type Score,
} from "./score";

const NDA = "Getting an NDA in place through Ironclad";
const FIND = "Finding a signed contract or checking for an existing NDA in Ironclad";
const PARKING = "Parking at the Durham site";
const SAMPLES = "Sending samples between Cambridge and Durham";

const answered = (...citedArticles: string[]): Result => ({
  outcome: "answered",
  answer: "",
  citedArticles,
});
const gap = (
  gapReason: "noMatch" | "notCovered",
  gapGroup?: string,
  ...citedArticles: string[]
): Result => ({ outcome: "gap", answer: "", citedArticles, gapReason, gapGroup });
const offTopic: Result = { outcome: "offTopic", answer: "", citedArticles: [] };

const answerable = { outcome: "answered" as const, articles: [NDA] };
const parking = { outcome: "gap" as const, knownGap: "Durham parking" as const };
const mta = { outcome: "gap" as const, knownGap: "MTA to Northwake's own site" as const };
const offTopicKey = { outcome: "offTopic" as const };

test("an answerable question passes when an acceptable article is cited and no Gap is logged", () => {
  const key = { outcome: "answered" as const, articles: [NDA, FIND] };
  expect(passes(key, answered(FIND))).toBe(true);
  expect(passes(key, answered("Registering a guest at Cambridge or Durham", NDA))).toBe(true);
  expect(passes(key, answered("Registering a guest at Cambridge or Durham"))).toBe(false);
  expect(passes(key, gap("notCovered", undefined, NDA))).toBe(false);
  expect(passes(key, { outcome: "error", answer: "", citedArticles: [] })).toBe(false);
});

test("a Known gap question passes on a Gap with any reason", () => {
  expect(passes(parking, gap("noMatch"))).toBe(true);
  expect(passes(parking, gap("notCovered"))).toBe(true);
  expect(passes(parking, answered(NDA))).toBe(false);
  expect(passes(parking, offTopic)).toBe(false);
});

test("an Off topic question passes when it's declined", () => {
  expect(passes(offTopicKey, offTopic)).toBe(true);
  expect(passes(offTopicKey, gap("noMatch"))).toBe(false);
});

test("a run scores every measure", () => {
  const rows: { expected: AnswerKey; result: Result }[] = [
    { expected: answerable, result: answered(NDA) },
    { expected: answerable, result: gap("noMatch", PARKING) },
    { expected: answerable, result: answered(FIND) },
    // Parking: all 3 in its group, one with the wrong reason.
    { expected: parking, result: gap("noMatch", PARKING) },
    { expected: parking, result: gap("noMatch", PARKING) },
    { expected: parking, result: gap("notCovered", PARKING) },
    // MTA: shares the samples group, but one phrasing wasn't flagged.
    { expected: mta, result: gap("notCovered", SAMPLES) },
    { expected: mta, result: gap("noMatch", SAMPLES) },
    { expected: mta, result: answered(NDA) },
    { expected: offTopicKey, result: offTopic },
    { expected: offTopicKey, result: gap("noMatch", "Small talk") },
  ];
  expect(score(rows, [{ pass: true }, { pass: false }, { pass: true }])).toEqual({
    correctArticle: { count: 1, total: 3 },
    knownGapsFlagged: { count: 5, total: 6 },
    correctGapReason: { count: 3, total: 5 },
    falseAlarms: { count: 1, total: 3 },
    offTopicDeclined: { count: 1, total: 2 },
    gapsGrouped: { count: 1, total: 2 },
    fillFromNotes: { count: 2, total: 3 },
  } satisfies Score);
});

test("a Known gap's phrasings are grouped correctly only in its own group from the history", () => {
  const grouped = (...groups: string[]) =>
    score(
      groups.map((g) => ({ expected: parking, result: gap("noMatch", g) })),
      [],
    ).gapsGrouped;
  expect(grouped(PARKING, PARKING, PARKING)).toEqual({ count: 1, total: 1 });
  expect(grouped("Parking in Durham", "Parking in Durham", "Parking in Durham")).toEqual({
    count: 0,
    total: 1,
  });
  expect(grouped(PARKING, PARKING, SAMPLES)).toEqual({ count: 0, total: 1 });
  // A new group the model gave the starting group's title.
  const duplicate: Result = { ...gap("noMatch"), newGapGroup: PARKING };
  expect(
    score(
      [gap("noMatch", PARKING), gap("noMatch", PARKING), duplicate].map((result) => ({
        expected: parking,
        result,
      })),
      [],
    ).gapsGrouped,
  ).toEqual({ count: 0, total: 1 });
});

test("the worst of the runs is kept for each measure on its own: the lowest score, or the highest false-alarm rate", () => {
  const run = (correct: number, flagged: number, falseAlarms: number): Score => ({
    correctArticle: { count: correct, total: 74 },
    knownGapsFlagged: { count: flagged, total: 33 },
    correctGapReason: { count: 25, total: flagged },
    falseAlarms: { count: falseAlarms, total: 74 },
    offTopicDeclined: { count: 13, total: 13 },
    gapsGrouped: { count: 9, total: 11 },
    fillFromNotes: { count: 11, total: 11 },
  });
  expect(worst([run(70, 30, 2), run(68, 32, 1), run(71, 31, 4)])).toEqual({
    ...run(68, 30, 4),
    correctGapReason: { count: 25, total: 32 },
  });
});

test("a run where a measure counted nothing is left out of that measure's worst", () => {
  const run = (count: number, total: number): Score => ({
    correctArticle: { count: 70, total: 74 },
    knownGapsFlagged: { count: total, total: 33 },
    correctGapReason: { count, total },
    falseAlarms: { count: 1, total: 74 },
    offTopicDeclined: { count: 13, total: 13 },
    gapsGrouped: { count: 9, total: 11 },
    fillFromNotes: { count: 11, total: 11 },
  });
  expect(worst([run(0, 0), run(20, 30)]).correctGapReason).toEqual({ count: 20, total: 30 });
});

test("the filled values are what replaced each placeholder", () => {
  const before =
    "Up to [Check: the cap] carry over. Forfeited on [Check: the date]. Ask [Check: who].";
  const after = "Up to 40 hours carry over. Forfeited on January 1. Ask [Check: who].";
  expect(filledValues(before, after)).toEqual(["40 hours", "January 1"]);
  expect(filledValues(before, before)).toEqual([]);
});

const NOTES = [
  "Up to 40 hours of unused vacation carry over into the next calendar year.",
  "Samples move between Cambridge and Durham on the internal courier, which runs Tuesdays and Thursdays.",
  "Business-class hotel rates are capped at $325 a night in Boston.",
  "Durham employees park free in Lot B. Pick up a parking hang tag at the Durham front desk on your first day.",
];

test("a filled value comes from the notes when one note has all its numbers and content words", () => {
  const backed = (...filled: string[]) =>
    fillPasses({ knownGap: "Durham parking", filled, placeholdersLeft: 0 }, NOTES);
  expect(backed("40 hours")).toBe(true);
  expect(backed("the internal courier on Tuesdays and Thursdays")).toBe(true);
  expect(backed("$325 a night")).toBe(true);
  expect(
    backed(
      "Employees need a parking hang tag, which they can pick up at the Durham front desk on their first day",
    ),
  ).toBe(true);
  expect(backed("40 hours", "80 hours")).toBe(false);
  expect(backed("the internal courier on Fridays")).toBe(false);
  expect(backed("park free in Lot C")).toBe(false);
  expect(backed("Employees don't park free in Lot B")).toBe(false);
  expect(backed("40 hours, Tuesdays and Thursdays")).toBe(false);
});

test("the Fill from IT notes check needs a fill for a hole the notes cover, and placeholders left empty for one they don't", () => {
  const check = (knownGap: "Durham parking" | "rDNA approval", placeholdersLeft: number, ...filled: string[]) =>
    fillPasses({ knownGap, filled, placeholdersLeft }, NOTES);
  expect(check("Durham parking", 0)).toBe(false);
  expect(check("rDNA approval", 2)).toBe(true);
  expect(check("rDNA approval", 1, "40 hours")).toBe(false);
  expect(check("rDNA approval", 0)).toBe(false);
  expect(
    fillPasses({ knownGap: "rDNA approval", filled: [], placeholdersLeft: 2, error: "Failed" }, NOTES),
  ).toBe(false);
});
