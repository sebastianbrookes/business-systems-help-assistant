# 06: Limits and the paused state

**What to build:** The demo can't be abused or run up a bill. Each Visitor gets 15 AI calls a day, and the whole app gets 250. When a limit is hit, or OpenRouter refuses the call with a 402 because the credit ran out, the typed question is still saved and the Visitor is told the assistant is paused and to try a Suggested question.

**Blocked by:** 04 (Draft article and approval)

**Status:** ready-for-agent

- [ ] Typed questions, Draft article clicks, and Fill from IT notes clicks (if built) each count as one AI call. A Gap's grouping call doesn't count separately.
- [ ] A Visitor is limited to 15 AI calls per UTC day, and the whole app to 250.
- [ ] A limit hit or an OpenRouter 402 saves the question as paused and shows the paused message suggesting a Suggested question.
- [ ] Tests with a faked clock cover the per-Visitor limit, the app limit, the reset at the next UTC day, and the 402 paused path.
