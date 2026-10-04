// Runs the Test set on the separate dev/test-set Convex deployment, never the
// live demo, and saves the results of all 3 runs and a summary in results/.
// It pushes the current code, and each run reloads a fresh copy of the
// starting data and asks the questions in order through the real assistant.
// Every question gets its own new Visitor, except that the 3 phrasings of a
// Known gap share one, so they can join one Gap group. There's no way to redo
// one run alone, so a bad run can't be swapped for a better one.
//
//   pnpm exec tsx scripts/runTestSet.ts
//
// The summary keeps each number's lowest score and Sebastian's notes already in it.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { MODEL } from "../convex/openrouter";
import { testSet, type TestQuestion } from "./testSet/questions";
import {
  lowest,
  passes,
  score,
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
  const client = new ConvexHttpClient(
    inlineQuery<string>("process.env.CONVEX_CLOUD_URL"),
  );

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
      result = {
        outcome: asked.outcome,
        answer: asked.answer,
        citedArticles: asked.citedArticles.map((a) => a.title),
        gapReason: asked.gapReason,
        gapGroupId: asked.gapGroupId,
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

  return {
    run: n,
    date: new Date().toISOString().slice(0, 10),
    model: MODEL,
    articleCount: titles.length,
    score: score(questions.map((q) => ({ expected: q, result: q.result }))),
    questions,
  };
}

const formatRatio = ({ passed, total }: Ratio) =>
  `${passed}/${total} (${Math.floor((100 * passed) / total)}%)`;

function writeSummary(runs: RunFile[]) {
  const path = `${RESULTS}/summary.md`;
  const notes = existsSync(path)
    ? readFileSync(path, "utf8").split(`${NOTES}\n`)[1]?.trim()
    : undefined;
  const kept = lowest(runs.map((r) => r.score));
  const row = (label: string, key: keyof Score) =>
    `| ${label} | ${runs.map((r) => formatRatio(r.score[key])).join(" | ")} | **${formatRatio(kept[key])}** |`;
  const count = (filter: (q: TestQuestion) => boolean) => testSet.filter(filter).length;
  writeFileSync(
    path,
    `# Test set results

Generated by \`scripts/runTestSet.ts\`. Each number is the lowest of 3 runs.

- **Dates:** ${[...new Set(runs.map((r) => r.date))].join(", ")}
- **Model:** ${[...new Set(runs.map((r) => r.model))].join(", ")}
- **Help articles:** ${[...new Set(runs.map((r) => r.articleCount))].join(", ")}
- **Test set:** ${testSet.length} questions: ${count((q) => q.outcome === "answered")} answerable (${count((q) => !!q.wrongSystem)} naming a system Northwake doesn't use), ${count((q) => q.outcome === "gap")} Known gap, and ${count((q) => q.outcome === "offTopic")} Off topic. Sebastian wrote ${count((q) => !!q.bySebastian)}.

| Measure | ${runs.map((r) => `[Run ${r.run}](run-${r.run}.json)`).join(" | ")} | Kept |
| --- | ${runs.map(() => "---").join(" | ")} | --- |
${row("Correct article", "correctArticle")}
${row("Known gaps flagged", "knownGapsFlagged")}

**Correct article:** an answerable question cites an acceptable article and logs no Gap. **Known gaps flagged:** a Known gap question logs a Gap, with any reason. Scoring uses no AI grading.

${NOTES}

${notes ?? "Sebastian: confirm you checked every answer key, and add your spot-check note on about 20 answers read for wrong content behind a correct citation."}
`,
  );
  console.log(`Wrote ${path}`);
}

const unwritten = testSet.filter((q) => !q.text.trim()).length;
if (unwritten) {
  throw new Error(
    `${unwritten} Test set questions have no text yet. Sebastian writes the ones marked bySebastian.`,
  );
}
mkdirSync(RESULTS, { recursive: true });
const runs: RunFile[] = [];
for (const n of RUNS) {
  const result = await run(n, n === 1);
  writeFileSync(runPath(n), JSON.stringify(result, null, 2) + "\n");
  console.log(`Run ${n}: correct article ${formatRatio(result.score.correctArticle)}, known gaps flagged ${formatRatio(result.score.knownGapsFlagged)}`);
  runs.push(result);
}
writeSummary(runs);
