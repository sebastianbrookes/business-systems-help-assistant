# 11: Test set and the two resume numbers

**What to build:** The resume numbers are measured honestly. Write a fixed Test set after the app is finished and run it 3 times against a fresh copy of the starting data, separate from the live demo. Keep the lowest score of each number.

**Blocked by:** 10 (Go live)

**Status:** ready-for-human

- [ ] The Test set has 120 questions that don't copy or closely reword the history questions. That's about 74 answerable (2 per article, about 10 naming the wrong system), 33 known-gap questions (3 phrasings of each of the 11 known gaps), and 13 Off topic.
- [ ] Sebastian writes about 20 in his own words and checks every answer key. An answer key can list more than one acceptable article.
- [x] A separate Convex deployment is loaded with a fresh copy of the starting data for each run, and questions run in a fixed order.
- [x] A script scores with no AI grading. **Correct article** means the expected article is cited and no Gap is logged. **Known gaps flagged** means a known-gap question gets a Gap with any reason.
- [ ] Each of the 3 runs saves a results file with every question, its answer key, the result, and pass/fail. A summary records the date, model, article count, both numbers (the lowest of 3), and Sebastian's spot-check note on about 20 answers.
- [ ] Results files and the summary are committed. The prompts weren't tuned on the Test set.

## Comments

**2026-10-04, build:** The agent's part is done. The runs wait on Sebastian.

- **Test set:** in `scripts/testSet/questions.ts`. AI wrote 100 questions with answer keys. The 20 marked `bySebastian` have empty text and a comment saying what to ask: 12 answerable (4 naming a wrong system), 5 Known gap, and 3 Off topic. The finished set is 120 questions: 74 answerable (2 for each of the 37 live articles, 10 naming a wrong system), 33 Known gap, and 13 Off topic. A review pass reworded the questions that sat closest to history questions and fixed 4 keys the articles didn't support.
- **Deployment:** `dev/test-set` in the help-assistant Convex project. It holds a copy of the build/test OpenRouter key and `ALLOW_SEED_RELOAD=true`. `seed:reload` deletes everything and loads a fresh copy of the starting data. It refuses to run on any deployment without that variable, including production.
- **Runner:** `pnpm exec tsx scripts/runTestSet.ts` pushes the current code and runs all 3 runs in order, reloading before each. Each question gets a new Visitor, except that a Known gap's 3 phrasings share one, so ticket 12 can check their grouping from the same runs. Results go to `results/run-N.json` and `results/summary.md`. Runs can't be redone one at a time. The runner stops on a paused answer, and records any other error as a fail. Each run makes about 150 AI calls.
- **Scoring:** `scripts/testSet/score.ts`, with unit tests. The spec has no seam for scripts, but these numbers go on the resume.
- **Smoke test:** before the review, three history questions ran on `dev/test-set`. A Known gap's two phrasings joined one group, an answer cited its article, and Off topic was declined. No Test set question has been asked.

Next, for Sebastian:
1. Write the 20 `bySebastian` questions and check every answer key. An answer key can list more than one acceptable article.
2. Build ticket 12 before the runs, so its measures come from the same 3 runs.
3. Run the runner, then fill in "Sebastian's checks" in `results/summary.md`: confirm the key check, and add the spot-check note on about 20 answers.

Ticket 12 needs a decision first. "MTA to Northwake's own site" overlaps "Shipping samples between sites": the Suggested Gap question joins the samples group. The MTA phrasings may land in that group with a No match reason.
