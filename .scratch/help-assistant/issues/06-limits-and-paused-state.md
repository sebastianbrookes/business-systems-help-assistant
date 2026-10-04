# 06: Limits and the paused state

**What to build:** The demo can't be abused or run up a bill. Each Visitor gets 15 AI calls a day, and the whole app gets 250. When a limit is hit, or OpenRouter refuses the call with a 402 because the credit ran out, the typed question is still saved and the Visitor is told the assistant is paused and to try a Suggested question.

**Blocked by:** 04 (Draft article and approval)

**Status:** ready-for-agent

- [x] Typed questions, Draft article clicks, and Fill from IT notes clicks (if built) each count as one AI call. A Gap's grouping call doesn't count separately.
- [x] A Visitor is limited to 15 AI calls per UTC day, and the whole app to 250.
- [x] A limit hit or an OpenRouter 402 saves the question as paused and shows the paused message suggesting a Suggested question.
- [x] Tests with a faked clock cover the per-Visitor limit, the app limit, the reset at the next UTC day, and the 402 paused path.

## Comments

**2026-10-04, implementation:** All boxes are met. `convex/limits.test.ts` covers the per-Visitor limit (and that a Gap's grouping call and Suggested questions don't count), Draft article and Fill from IT notes clicks counting, the app limit across 25 Visitors, the reset at 00:00 UTC, and the 402 path for a typed question and a Draft article click.

How it works: before each counted model call, `countAiCall` in `convex/limits.ts` runs one mutation that checks and bumps the Visitor's and the app's counters for the UTC day, so two tabs can't race past a limit. Over a limit, or on an OpenRouter 402, it throws a `PausedError` with the paused message. A typed question catches it and is saved with outcome paused and the message as its answer. Draft article and Fill from IT notes clicks show the message as an error. Draft counts only after the group is confirmed Open. Fill counts only when it reaches the model call.

Choices to check:
- The question is saved once, with its final result, rather than saved first and updated. That keeps the rule that malformed model output saves nothing. An OpenRouter 500 or a malformed reply still loses the typed question, as before.
- A call is counted before it runs, so one that gets a 402 or a malformed reply still uses one of the 15.
- A 402 on a Gap's grouping call saves the question as paused, dropping the answer already received. This needs the credit to run out between two calls, so it's rare.
- Didn't help's grouping call isn't counted, matching the spec's list. Each answered question allows it once.
