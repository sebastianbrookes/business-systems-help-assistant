# 12: Tracked measures

**What to build:** The case study can show more than the two resume numbers. Add the extra measures to the scoring script and the summary. This is first on the cut list.

**Blocked by:** 11 (Test set and the two resume numbers), 05 (Fill from IT notes)

**Status:** ready-for-agent

- [x] The summary adds: correct Gap reason, false-alarm rate (answerable questions logged as Gaps), Off topic declined correctly, and Gaps grouped correctly (the 3 phrasings of a hole land in one group).
- [x] A Fill from IT notes check runs across the 11 known gaps. It passes when every filled value comes from the notes and the rDNA and accruals placeholders stay empty.
- [x] All measures use the same 3 runs and keep the lowest score.

## Comments

**2026-10-04, implementation:** All boxes are met in code. The numbers appear when Sebastian runs `pnpm exec tsx scripts/runTestSet.ts`, which now records every measure from the same 3 runs. Scoring is in `scripts/testSet/score.ts`, with unit tests.

Sebastian's decisions on the MTA overlap:
- **Gaps grouped correctly:** all 3 phrasings of a Known gap must join that hole's starting Gap group from the history, not just any one group. A phrasing that starts a duplicate group or joins an unrelated one fails. A group the Visitor started never counts, even when the model gave it the starting group's title. The MTA hole's group is "Sending samples between Cambridge and Durham", since the history already files the cell-lines MTA question there. Each hole's group is in `KNOWN_GAPS`.
- **MTA Gap reason:** stays Not covered.

How the measures count:
- **Correct Gap reason** counts only Known gap questions that logged a Gap, so it doesn't repeat Known gaps flagged.
- **False alarms** is answerable questions logged as Gaps. Lower is better, so the summary keeps the highest of the 3 runs. Every other measure keeps its lowest.
- **Fill from IT notes:** one pass or fail per Known gap, so the summary shows a count out of 11. After the questions, each Known gap's Visitor drafts its starting group, unless the group already has a draft (time off), and clicks Fill. The values that replaced placeholders are worked out by comparing the draft before and after. A value passes when one note has every number and content word in it. Function words such as "they" or "which" are ignored, but negations and single letters such as "Lot C" are checked. A hole the notes cover fails if nothing is filled. rDNA approval and CRO accruals pass only with nothing filled and placeholders left. A fact reworded beyond function words fails, so this measure leans low.
- Each run adds up to 21 AI calls: 10 drafts and 11 fills. Calls counted against the limits come to at most 141, under the app's 250 a day, because the grouping call isn't counted. Each Known gap's Visitor makes at most 5, under 15.

Smoke test on `dev/test-set`, with no Test set questions asked: a fresh Visitor drafted and filled the Durham parking, rDNA, and time off groups. Parking filled 5 placeholders, all note-backed. rDNA filled none. Time off got 40 hours, January 1, and March 31. All 3 passed. The first version of the word check failed a correct parking fact for adding "they can", which led to ignoring function words.

**2026-10-04, review fixes:** Grouping now compares group IDs against the starting groups rather than titles, so a new group that copies a starting title fails. The fill check fails a covered hole with nothing filled, and checks that rDNA and accruals still have placeholders. A run where a measure counted nothing, such as 0 flagged Known gaps, is left out of that measure's worst. The runner reads the notes from `convex/startingItTeamNotes.ts`, which the reload loads.

Next, for Sebastian: run `pnpm exec tsx scripts/runTestSet.ts`, then add the spot-check note in `results/summary.md` (ticket 11).

**2026-10-04, results:** From the same 3 runs, the worst of 3 is: Correct Gap reason 30/33 (90%), False alarms 6/74 (8%), Off topic declined 13/13 (100%), Gaps grouped correctly 9/11 (81%), and Fill from IT notes 3/11 (27%).

The fill number mostly measures rewording. An AI agent (Sonnet 5.5) read all 85 filled values against the notes. 83 state only what a note states, 2 add something, and none contradicts a note. By that reading, the worst run passes 10 of 11 Known gaps. The 2 that add something are a "the notes don't specify…" sentence written into the run 1 employment letter draft, and "files over 10 GB can't be shared" in run 2. The summary keeps 3/11, the rule set before the runs, and records the review under Checks. Ticket 13 should show both numbers, or the reviewed one with the rule explained. The scoring rule wasn't changed after the results.
