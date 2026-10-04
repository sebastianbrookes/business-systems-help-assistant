// Runs the Test set on the separate dev/test-set Convex deployment, never the
// live demo, and saves the results of all 3 runs and a summary in results/.
// It pushes the current code, and each run reloads a fresh copy of the
// starting data and asks the questions in order through the real assistant.
// Every question gets its own new Visitor, except that the 3 phrasings of a
// Known gap share one, so they can join one Gap group. There's no way to redo
// one run alone, so a bad run can't be swapped for a better one. After the
// questions, each Known gap's Visitor drafts its history Gap group and fills
// it from the IT team notes.
//
//   pnpm exec tsx scripts/runTestSet.ts
//
// The summary keeps each measure's worst score and Sebastian's notes already in it.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { ConvexHttpClient } from "convex/browser";
import { ConvexError } from "convex/values";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { MODEL, PausedError } from "../convex/openrouter";
import { placeholdersIn } from "../convex/placeholders";
import { startingItTeamNotes } from "../convex/startingItTeamNotes";
import {
  KNOWN_GAPS,
  testSet,
  type KnownGap,
  type TestQuestion,
} from "./testSet/questions";
import {
  filledValues,
  fillPasses,
  passes,
  score,
  worst,
  type FillCheck,
  type Ratio,
  type Result,
  type Score,
} from "./testSet/score";

const DEPLOYMENT = "dev/test-set";
const RESULTS = "results";
const RUNS = [1, 2, 3];
const NOTES = "## Sebastian's checks";

type RunFile = {
  run: number;
  date: string;
  model: string;
  articleCount: number;
  score: Score;
  questions: (TestQuestion & { visitorId: string; result: Result; pass: boolean })[];
  fillChecks: (FillCheck & { visitorId: string; pass: boolean })[];
};

const runPath = (run: number) => `${RESULTS}/run-${run}.json`;

function convex(...args: string[]) {
  return execFileSync(
    "pnpm",
    ["exec", "convex", "run", ...args, "--deployment", DEPLOYMENT],
    { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  );
}

/** Runs a read-only query on the test deployment and returns its result. */
const inlineQuery = <T>(source: string): T =>
  JSON.parse(convex("--inline-query", source));

/** The titles of the Help articles a new Visitor sees, leaving out replaced ones. */
const liveArticleTitles = () =>
  inlineQuery<string[]>(`
    const articles = await ctx.db.query("helpArticles").collect();
    const replaced = new Set(articles.map((a) => a.revisesArticleId));
    return articles.filter((a) => !replaced.has(a._id)).map((a) => a.title);
  `);

/** The starting Gap groups' titles by ID. A Visitor's new group can share a starting group's title. */
const startingGroupTitles = () =>
  new Map(
    inlineQuery<[Id<"gapGroups">, string][]>(`
      const groups = await ctx.db.query("gapGroups").collect();
      return groups.filter((g) => !g.visitorId).map((g) => [g._id, g.title]);
    `),
  );

const notes = startingItTeamNotes.map((n) => n.text);

/** Whether a call failed on a limit or a 402, which stops the run. */
const isPaused = (e: unknown) =>
  e instanceof ConvexError && e.data === new PausedError().data;

/** Throws if any answer key names an article a new Visitor doesn't see. */
function checkAnswerKeys(titles: string[]) {
  for (const q of testSet) {
    const unknown =
      q.outcome === "answered" ? q.articles.filter((a) => !titles.includes(a)) : [];
    if (unknown.length) {
      throw new Error(`"${q.text}" expects articles that aren't live: ${unknown}`);
    }
  }
}

async function run(n: number, push: boolean): Promise<RunFile> {
  console.log(`Run ${n}: reloading the starting data on ${DEPLOYMENT}`);
  convex("seed:reload", ...(push ? ["--push"] : []));
  const titles = liveArticleTitles();
  checkAnswerKeys(titles);
  const startingGroups = startingGroupTitles();
  const client = new ConvexHttpClient(
    inlineQuery<string>("process.env.CONVEX_CLOUD_URL"),
  );

  /** Drafts the Known gap's starting group if it's Open, fills it from the notes, and checks the fill. */
  async function fillCheck(knownGap: KnownGap, visitorId: string) {
    let check: FillCheck;
    try {
      const { group } = KNOWN_GAPS[knownGap];
      const gapGroupId = [...startingGroups].find(([, title]) => title === group)?.[0];
      if (!gapGroupId) throw new Error(`No starting Gap group "${group}"`);
      const get = () => client.query(api.gapGroups.get, { visitorId, gapGroupId });
      if ((await get()).state === "open") {
        await client.action(api.draftArticles.draft, { visitorId, gapGroupId });
      }
      const { draft } = await get();
      const filled = await client.action(api.draftArticles.fill, { visitorId, gapGroupId });
      const after = `${filled.title}\n${filled.body}`;
      check = {
        knownGap,
        filled: filledValues(`${draft!.title}\n${draft!.body}`, after),
        placeholdersLeft: placeholdersIn(after).length,
      };
    } catch (e) {
      if (isPaused(e)) throw new Error(`Run ${n} hit a limit or ran out of credit: ${e}`);
      check = { knownGap, filled: [], placeholdersLeft: 0, error: String(e) };
    }
    return { ...check, visitorId, pass: fillPasses(check, notes) };
  }

  const questions: RunFile["questions"] = [];
  for (const [i, q] of testSet.entries()) {
    const visitorId =
      q.outcome === "gap"
        ? `test-set-run-${n}-${q.knownGap.replace(/\W+/g, "-").toLowerCase()}`
        : `test-set-run-${n}-q${i + 1}`;
    let result: Result;
    try {
      const id = await client.action(api.questions.ask, { visitorId, text: q.text });
      const asked = (await client.query(api.questions.list, { visitorId })).find(
        (a) => a._id === id,
      )!;
      const groups = await client.query(api.gapGroups.list, { visitorId });
      const group = groups.find((g) => g._id === asked.gapGroupId);
      result = {
        outcome: asked.outcome,
        answer: asked.answer,
        citedArticles: asked.citedArticles.map((a) => a.title),
        gapReason: asked.gapReason,
        ...(group &&
          (startingGroups.has(group._id)
            ? { gapGroup: group.title }
            : { newGapGroup: group.title })),
      };
    } catch (e) {
      result = { outcome: "error", answer: String(e), citedArticles: [] };
    }
    if (result.outcome === "paused") {
      throw new Error(`Run ${n} hit a limit or ran out of credit: ${result.answer}`);
    }
    const pass = passes(q, result);
    questions.push({ ...q, visitorId, result, pass });
    console.log(`${i + 1}/${testSet.length} ${pass ? "pass" : "FAIL"} ${q.text}`);
  }

  const fillChecks: RunFile["fillChecks"] = [];
  for (const knownGap of Object.keys(KNOWN_GAPS) as KnownGap[]) {
    const visitorId = questions.find(
      (q) => q.outcome === "gap" && q.knownGap === knownGap,
    )!.visitorId;
    const check = await fillCheck(knownGap, visitorId);
    fillChecks.push(check);
    console.log(`Fill ${check.pass ? "pass" : "FAIL"} ${knownGap}: ${check.error ?? check.filled.join("; ")}`);
  }

  return {
    run: n,
    date: new Date().toISOString().slice(0, 10),
    model: MODEL,
    articleCount: titles.length,
    score: score(
      questions.map((q) => ({ expected: q, result: q.result })),
      fillChecks,
    ),
    questions,
    fillChecks,
  };
}

const formatRatio = ({ count, total }: Ratio) =>
  `${count}/${total} (${total ? `${Math.floor((100 * count) / total)}%` : "n/a"})`;

function writeSummary(runs: RunFile[]) {
  const path = `${RESULTS}/summary.md`;
  const notes = existsSync(path)
    ? readFileSync(path, "utf8").split(`${NOTES}\n`)[1]?.trim()
    : undefined;
  const kept = worst(runs.map((r) => r.score));
  const row = (label: string, key: keyof Score) =>
    `| ${label} | ${runs.map((r) => formatRatio(r.score[key])).join(" | ")} | **${formatRatio(kept[key])}** |`;
  const count = (filter: (q: TestQuestion) => boolean) => testSet.filter(filter).length;
  writeFileSync(
    path,
    `# Test set results

Generated by \`scripts/runTestSet.ts\`. Each measure keeps its worst of 3 runs: the lowest score, or the highest false-alarm rate.

- **Dates:** ${[...new Set(runs.map((r) => r.date))].join(", ")}
- **Model:** ${[...new Set(runs.map((r) => r.model))].join(", ")}
- **Help articles:** ${[...new Set(runs.map((r) => r.articleCount))].join(", ")}
- **Test set:** ${testSet.length} questions: ${count((q) => q.outcome === "answered")} answerable (${count((q) => !!q.wrongSystem)} naming a system Northwake doesn't use), ${count((q) => q.outcome === "gap")} Known gap, and ${count((q) => q.outcome === "offTopic")} Off topic. A separate AI agent that never saw the Help articles wrote ${count((q) => !!q.writtenBlind)} of them.

| Measure | ${runs.map((r) => `[Run ${r.run}](run-${r.run}.json)`).join(" | ")} | Kept |
| --- | ${runs.map(() => "---").join(" | ")} | --- |
${row("Correct article", "correctArticle")}
${row("Known gaps flagged", "knownGapsFlagged")}
${row("Correct Gap reason", "correctGapReason")}
${row("False alarms", "falseAlarms")}
${row("Off topic declined", "offTopicDeclined")}
${row("Gaps grouped correctly", "gapsGrouped")}
${row("Fill from IT notes", "fillFromNotes")}

The first two are the resume numbers. Scoring uses no AI grading.

- **Correct article:** an answerable question cites an acceptable article and logs no Gap.
- **Known gaps flagged:** a Known gap question logs a Gap, with any reason.
- **Correct Gap reason:** a flagged Known gap question gets its hole's reason, No match or Not covered.
- **False alarms:** an answerable question logs a Gap. Lower is better.
- **Off topic declined:** an Off topic question is declined.
- **Gaps grouped correctly:** all 3 phrasings of a Known gap join its Gap group from the history. The MTA hole's group is the samples group, where the history files it.
- **Fill from IT notes:** each Known gap's Visitor drafts its group, if it's Open, and fills it from the IT team notes. It passes when one note has every number and word of each filled value, and nothing is filled for rDNA approval or CRO accruals, which the notes don't cover. A reworded fact fails.

${NOTES}

${notes ?? "Every answer key was cross-checked by a separate AI agent that saw the Help articles and the shuffled questions but never the keys, and disagreements were settled. Sebastian: add your spot-check note on about 20 answers read for wrong content behind a correct citation."}
`,
  );
  console.log(`Wrote ${path}`);
}

mkdirSync(RESULTS, { recursive: true });
const runs: RunFile[] = [];
for (const n of RUNS) {
  const result = await run(n, n === 1);
  writeFileSync(runPath(n), JSON.stringify(result, null, 2) + "\n");
  console.log(`Run ${n}: correct article ${formatRatio(result.score.correctArticle)}, known gaps flagged ${formatRatio(result.score.knownGapsFlagged)}, fill ${formatRatio(result.score.fillFromNotes)}`);
  runs.push(result);
}
writeSummary(runs);
