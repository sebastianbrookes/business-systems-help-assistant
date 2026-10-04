import { expect, test } from "vitest";
import { lowest, passes, score, type Result } from "./score";

const NDA = "Getting an NDA in place through Ironclad";
const FIND = "Finding a signed contract or checking for an existing NDA in Ironclad";

const answered = (...citedArticles: string[]): Result => ({
  outcome: "answered",
  answer: "",
  citedArticles,
});
const gap = (gapReason: "noMatch" | "notCovered", ...citedArticles: string[]): Result => ({
  outcome: "gap",
  answer: "",
  citedArticles,
  gapReason,
});
const offTopic: Result = { outcome: "offTopic", answer: "", citedArticles: [] };

test("an answerable question passes when an acceptable article is cited and no Gap is logged", () => {
  const key = { outcome: "answered" as const, articles: [NDA, FIND] };
  expect(passes(key, answered(FIND))).toBe(true);
  expect(passes(key, answered("Registering a guest at Cambridge or Durham", NDA))).toBe(true);
  expect(passes(key, answered("Registering a guest at Cambridge or Durham"))).toBe(false);
  expect(passes(key, gap("notCovered", NDA))).toBe(false);
  expect(passes(key, { outcome: "error", answer: "", citedArticles: [] })).toBe(false);
});

test("a Known gap question passes on a Gap with any reason", () => {
  const key = { outcome: "gap" as const, knownGap: "Durham parking" as const };
  expect(passes(key, gap("noMatch"))).toBe(true);
  expect(passes(key, gap("notCovered"))).toBe(true);
  expect(passes(key, answered(NDA))).toBe(false);
  expect(passes(key, offTopic)).toBe(false);
});

test("an Off topic question passes when it's declined", () => {
  const key = { outcome: "offTopic" as const };
  expect(passes(key, offTopic)).toBe(true);
  expect(passes(key, gap("noMatch"))).toBe(false);
});

test("a run scores the two resume numbers, leaving Off topic questions out of both", () => {
  const rows = [
    { expected: { outcome: "answered" as const, articles: [NDA] }, result: answered(NDA) },
    { expected: { outcome: "answered" as const, articles: [NDA] }, result: gap("noMatch") },
    { expected: { outcome: "gap" as const, knownGap: "Durham parking" as const }, result: gap("noMatch") },
    { expected: { outcome: "offTopic" as const }, result: offTopic },
  ];
  expect(score(rows)).toEqual({
    correctArticle: { passed: 1, total: 2 },
    knownGapsFlagged: { passed: 1, total: 1 },
  });
});

test("the lowest of the runs is kept for each number on its own", () => {
  expect(
    lowest([
      { correctArticle: { passed: 70, total: 74 }, knownGapsFlagged: { passed: 30, total: 33 } },
      { correctArticle: { passed: 68, total: 74 }, knownGapsFlagged: { passed: 32, total: 33 } },
      { correctArticle: { passed: 71, total: 74 }, knownGapsFlagged: { passed: 31, total: 33 } },
    ]),
  ).toEqual({
    correctArticle: { passed: 68, total: 74 },
    knownGapsFlagged: { passed: 30, total: 33 },
  });
});
