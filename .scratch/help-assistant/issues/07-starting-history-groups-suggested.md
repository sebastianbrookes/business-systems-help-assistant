# 07: Starting history, starting Gap groups, and Suggested questions

**What to build:** The demo looks like 8 weeks of real use that ends today. Seven starting Gap groups exist across all three states, and three Suggested questions work instantly at no cost. The history runs once through the real assistant, and the output is saved as seed files, so deploys and test copies load identical data without new AI calls.

**Blocked by:** 02 (Northwake's Help articles and IT team notes), 04 (Draft article and approval)

**Status:** ready-for-agent

- [x] **Open groups:** Sending samples between Cambridge and Durham (4 questions), Using AI tools with company files, Moving MFA to a new phone (shows a revision draft), and Parking at the Durham site.
- [x] **Drafted group:** Carrying over unused time off, a pending revision of the Workday article.
- [x] **Resolved groups:** Laptop for a consultant (approved about 3 weeks ago) and Badge access (approved about 2 weeks ago). Each shows Gaps before approval and answered questions after.
- [x] The remaining holes form small Open groups of 1–3 questions, below the four main ones.
- [x] About 300 history questions have run once through the real assistant. The mix is about 70% answered, 20% Gaps, and 10% Off topic. By department it's Finance 30%, IT 25%, HR 20%, Ops 15%, and Legal 10%. There are no fake names. Didn't help clicks were added on answers from the two out-of-date articles.
- [x] History is stored as "days ago" and always shows as the 8 weeks ending today.
- [x] There are three Suggested questions, each with a hint saying what will happen. The answered one is "How do I order lab supplies from Fisher?" The Gap one, marked "try this one", is "Do I need an MTA to send samples to our Durham site?" The Off topic one is "What's a good blocking buffer for a Western blot?" Each uses a saved answer and saved grouping, with no AI call and no limit used.
- [x] The Gap Suggested question joins the Sending samples group, which then shows 5 questions.
- [x] The seed output is committed, and loading it needs no AI calls.
- [x] Tests cover a Suggested question making no AI call and using no limit, and history dates moving with today.

## Comments

**2026-10-04, implementation:** All boxes are met in code. `convex/startingHistory.test.ts` covers loading with no AI call, the seven groups and their states, the revision groups, the Resolved groups' before and after, dates moving with today under a faked clock, and the Suggested questions making no AI call. Checked in the browser on the dev deployment: the MTA Suggested question took Sending samples to 5 questions, and Badge access showed its Didn't help Gaps (2 to 7 weeks ago), "Approved 2 weeks ago", and 3 answers since.

How the seed is built:

- `convex/startingGapGroups.ts` is hand-written: the seven groups, `revises` on the MFA, time off, and badge groups, and their drafts. The laptop and badge articles were filled from the IT team notes. The time off draft keeps 3 [Check: …] placeholders, all backed by the notes, for Fill from IT notes.
- `scripts/history/questions.ts` holds the 300 AI-written questions. `scripts/generateHistory.ts` runs them through the real `answerAndTag` and `groupGap`, with the articles live on each question's day (the laptop article from 21 days ago, the badge revision from 14). It adds the Didn't help clicks and writes `convex/startingHistory.ts`. Replies are cached in a gitignored file, so re-runs are free. Run it with `OPENROUTER_API_KEY=$(pnpm exec convex env get OPENROUTER_API_KEY) pnpm exec tsx scripts/generateHistory.ts`.
- The result: 221 answered, 49 Gaps plus 8 Didn't help, and 30 Off topic. On-topic questions split Finance 31%, IT 25%, HR 20%, Ops 13%, and Legal 11%.

Sebastian, please skim these:

- **Reworded questions.** The first run turned 20 questions I'd written as answerable into Gaps. Most asked for details the articles don't state, such as how long supplier setup takes. A few were model misses on stated facts, such as three quotes over $10,000. I reworded 19 to fit their articles. Two misses remain as real output, each a one-question Open group: "Submitting a CRO SOW change order" and "Using a missing receipt declaration for an expense". "I'm not getting MFA text codes anymore" also came back a Gap, which fits the out-of-date article, so it stays.
- **Group adjustments** are listed in `groupAdjustments` in the script. Four questions that split off went back into their main groups. The hotel group was renamed "Maximum hotel rates by city", because the grouping call named it after its first question, about Durham.

Decisions to know before 06, 08, and 09:

- Gap groups now list Open, then Drafted, then Resolved, each by count. This keeps the four main Open groups at the top, even though the larger Drafted and Resolved groups bring the Gap share to about 20%.
- Starting rows store `daysAgo`. `happenedAt` in `convex/history.ts` turns that into a time using `Date.now()` in the query. Convex doesn't re-run a query as the clock moves, which is fine at day scale. The Dashboard (08) can use `happenedAt` and `startingAndOwnQuestions`.
- Approval now stores `articleId` on the draft. A Resolved group's "answered after" list is the visible answered questions citing that article.
- `questions.askSuggested` is a mutation, so it can't make an AI call. There are no limits yet. The test asks 20 times, more than the per-Visitor limit of 15, so ticket 06 inherits a guard. Asking the same Suggested question again adds another question.
- `setup()` in the tests still loads only articles and notes. `setupWithHistory()` loads everything.

**2026-10-04, review fixes:** "Approved …" on a Resolved group now uses the approval time for a Visitor's own approval, not the drafting time. The Off topic hint says "business system", matching the glossary. The cached replies show the grouping call put the MTA Suggested question in Sending samples by itself. Two things for later tickets: Didn't help rows keep no `gapReason`, so the Dashboard (08) must count `didntHelp` as Gaps the way `gapView` does. Also, five history Gaps came back with no department or system tag, so they won't show in by-system counts.
