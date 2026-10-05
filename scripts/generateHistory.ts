// Runs the history questions and Suggested questions once through the real
// assistant and writes convex/startingHistory.ts, so deploys and test copies
// load the same data with no AI calls. Model replies are cached in
// scripts/history/.cache.json (gitignored), so a re-run after changing the
// adjustments below makes no new calls.
//
//   OPENROUTER_API_KEY=$(pnpm exec convex env get OPENROUTER_API_KEY) pnpm exec tsx scripts/generateHistory.ts

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { Doc } from "../convex/_generated/dataModel";
import { answerAndTag } from "../convex/answerAndTag";
import { groupGap } from "../convex/groupGap";
import { startingArticles } from "../convex/startingArticles";
import {
  approvedRef,
  startingGapGroups,
  type StartingQuestion,
  type SuggestedQuestion,
} from "../convex/startingGapGroups";
import { historyQuestions, type Expected } from "./history/questions";

const CACHE = "scripts/history/.cache.json";
const OUTPUT = "convex/startingHistory.ts";
const HISTORY_DAYS = 8 * 7;
const SUGGESTED_GAP_GROUP = "Using AI tools with company files";
// Answers that cite these first get a Didn't help click.
const OUT_OF_DATE = [
  "Moving MFA to a new phone",
  "Getting badge access to a lab suite",
];

/**
 * Light adjustments made after reviewing a run: a question's text, and the Gap
 * group it goes in instead of where the grouping call put it.
 */
const groupAdjustments: Record<string, string> = {
  // Split off from the main groups they ask about.
  "How do I get a Microsoft 365 Copilot license?":
    "Using AI tools with company files",
  "I'm not getting MFA text codes anymore. What do I do?":
    "Moving MFA to a new phone",
  "Who returns a contractor's laptop when the contract ends?":
    "Laptop for a consultant",
  "Can I get a letter confirming my salary for a mortgage application?":
    "Requesting an employment verification letter",
  "Do we need a city permit for recombinant DNA work in Cambridge?":
    "Getting approval for recombinant DNA work",
  // The grouping call titled this group after its first question, about Durham.
  "How much can I spend on a hotel in Durham?": "Maximum hotel rates by city",
  "What's the max hotel rate I can book in Boston?":
    "Maximum hotel rates by city",
  "Is there a nightly limit for hotels in Cambridge?":
    "Maximum hotel rates by city",
};

const suggested: { text: string; hint: string; expected: Expected }[] = [
  {
    text: "How do I order lab supplies from Fisher?",
    hint: "Answered from a Help article",
    expected: "answered",
  },
  {
    text: "Can I paste a client spreadsheet into ChatGPT?",
    hint: "Not in the Help articles yet, so it goes to the IT team",
    expected: "gap",
  },
  {
    text: "What's a good blocking buffer for a Western blot?",
    hint: "Not about a business system, so it's politely declined",
    expected: "offTopic",
  },
];

// Articles get short stand-in IDs for the model, mapped back to ArticleRefs.
type Article = {
  doc: Doc<"helpArticles">;
  ref: string;
  approvedDaysAgo?: number;
  revises?: string;
};
const asDoc = <T extends Doc<"helpArticles"> | Doc<"gapGroups">>(
  _id: string,
  fields: object,
) => ({ _id, _creationTime: 0, ...fields }) as unknown as T;
const articles: Article[] = [
  ...startingArticles.map((a, i) => ({
    doc: asDoc<Doc<"helpArticles">>(`a${i + 1}`, a),
    ref: a.title,
  })),
  ...startingGapGroups.flatMap(({ title, revises, draft }, i) => {
    if (draft?.status !== "approved") return [];
    const { status, daysAgo, ...fields } = draft;
    return [
      {
        doc: asDoc<Doc<"helpArticles">>(`g${i + 1}`, fields),
        ref: approvedRef(title),
        approvedDaysAgo: daysAgo,
        revises,
      },
    ];
  }),
];
const refOf = new Map(articles.map((a) => [a.doc._id as string, a.ref]));

/** The articles live on a day: the starting ones, plus those approved before it, minus what those revise. */
function articlesOn(daysAgo: number) {
  const live = articles.filter(
    (a) => a.approvedDaysAgo === undefined || a.approvedDaysAgo > daysAgo,
  );
  const replaced = new Set(live.map((a) => a.revises));
  return live.filter(
    (a) => a.approvedDaysAgo !== undefined || !replaced.has(a.ref),
  );
}

const cache: Record<string, unknown> = existsSync(CACHE)
  ? JSON.parse(readFileSync(CACHE, "utf8"))
  : {};

/** Runs a model call once, retrying unusable replies, and caches the result. */
async function cached<T>(key: string, call: () => Promise<T>): Promise<T> {
  if (key in cache) return cache[key] as T;
  for (let attempt = 1; ; attempt++) {
    try {
      const result = await call();
      cache[key] = result;
      writeFileSync(CACHE, JSON.stringify(cache));
      return result;
    } catch (e) {
      if (attempt === 3) throw e;
      console.warn(`Retrying after: ${e}`);
    }
  }
}

function answer(text: string, daysAgo: number) {
  const live = articlesOn(daysAgo).map((a) => a.doc);
  return cached(`answer ${text} | ${live.map((a) => a._id)}`, () =>
    answerAndTag(text, live),
  );
}

type Gap = Parameters<typeof groupGap>[0];
type Group = { title: string; resolvedDaysAgo?: number };
const groups: Group[] = startingGapGroups.map(({ title, draft }) => ({
  title,
  resolvedDaysAgo: draft?.status === "approved" ? draft.daysAgo : undefined,
}));

/** The title of the group the grouping call puts a Gap in, among the groups not yet Resolved that day. */
async function groupTitle(gap: Gap, daysAgo: number) {
  const joinable = groups.filter(
    (g) => g.resolvedDaysAgo === undefined || g.resolvedDaysAgo <= daysAgo,
  );
  const docs = joinable.map((g, i) =>
    asDoc<Doc<"gapGroups">>(`group${i + 1}`, { title: g.title }),
  );
  const key = JSON.stringify([gap, joinable.map((g) => g.title)]);
  const grouping = await cached(`group ${key}`, () => groupGap(gap, docs));
  if ("newGroupTitle" in grouping) return grouping.newGroupTitle;
  return joinable[docs.findIndex((d) => d._id === grouping.gapGroupId)].title;
}

/** Runs `run` on every item, `size` at a time. */
async function inPool<T, R>(items: T[], size: number, run: (item: T) => Promise<R>) {
  const results: R[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await run(items[i]);
      }
    }),
  );
  return results;
}

/** A seeded random number generator (mulberry32), so days stay put between runs. */
function seededRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = seededRandom(7);
const dated = historyQuestions.map((q) => ({
  ...q,
  daysAgo: q.daysAgo ?? Math.floor(random() * HISTORY_DAYS),
}));
let done = 0;
const answered = await inPool(dated, 8, async (q) => {
  const result = await answer(q.text, q.daysAgo);
  if (++done % 25 === 0) console.log(`Answered ${done}/${dated.length}`);
  return { ...q, ...result };
});

// Oldest first, which is also the order the seed inserts them.
const history = answered
  .map((q) => ({
    ...q,
    didntHelp:
      q.outcome === "answered" &&
      OUT_OF_DATE.includes(refOf.get(q.citedArticleIds[0])!),
    gapGroup: undefined as string | undefined,
  }))
  .sort((a, b) => b.daysAgo - a.daysAgo);
for (const q of history) {
  if (q.outcome !== "gap" && !q.didntHelp) continue;
  q.gapGroup =
    groupAdjustments[q.text] ??
    (await groupTitle(
      {
        text: q.text,
        answer: q.answer,
        gapReason: q.gapReason,
        didntHelp: q.didntHelp,
      },
      q.daysAgo,
    ));
  if (!groups.some((g) => g.title === q.gapGroup)) {
    groups.push({ title: q.gapGroup });
  }
}

const startingQuestions: StartingQuestion[] = history.map((q) => ({
  text: q.text,
  daysAgo: q.daysAgo,
  outcome: q.outcome,
  gapReason: q.gapReason,
  didntHelp: q.didntHelp || undefined,
  gapGroup: q.gapGroup,
  department: q.department,
  system: q.system,
  cited: q.citedArticleIds.map((id) => refOf.get(id)!),
  answer: q.answer,
}));

const suggestedQuestions: SuggestedQuestion[] = [];
for (const s of suggested) {
  const result = await answer(s.text, 0);
  if (result.outcome !== s.expected) {
    throw new Error(`Suggested "${s.text}" was ${result.outcome}`);
  }
  if (result.outcome === "gap") {
    const title = await groupTitle({ text: s.text, ...result }, 0);
    if (title !== SUGGESTED_GAP_GROUP) console.warn(`Suggested Gap grouped into "${title}"`);
  }
  suggestedQuestions.push({
    text: s.text,
    hint: s.hint,
    outcome: result.outcome,
    gapReason: result.gapReason,
    // The Gap one always joins the main example group.
    gapGroup: result.outcome === "gap" ? SUGGESTED_GAP_GROUP : undefined,
    department: result.department,
    system: result.system,
    cited: result.citedArticleIds.map((id) => refOf.get(id)!),
    answer: result.answer,
  });
}

writeFileSync(
  OUTPUT,
  `// Generated by scripts/generateHistory.ts from scripts/history/questions.ts.
// Don't edit by hand: change those and run the script again.
import type { StartingQuestion, SuggestedQuestion } from "./startingGapGroups";

export const startingQuestions: StartingQuestion[] = ${JSON.stringify(startingQuestions, null, 2)};

export const suggestedQuestions: SuggestedQuestion[] = ${JSON.stringify(suggestedQuestions, null, 2)};
`,
);

// A summary for reviewing the run.
const countBy = (values: (string | undefined)[]) =>
  Object.fromEntries(
    [...new Set(values)].map((v) => [v, values.filter((x) => x === v).length]),
  );
console.log("Outcomes:", countBy(history.map((q) => q.outcome)));
console.log("Didn't help:", history.filter((q) => q.didntHelp).length);
console.log("Departments:", countBy(history.map((q) => q.department)));
console.log("Gap groups:", countBy(history.map((q) => q.gapGroup).filter(Boolean)));
for (const q of history) {
  if (q.outcome !== q.expected) {
    console.log(`Expected ${q.expected}, got ${q.outcome}: ${q.text}`);
  }
}
