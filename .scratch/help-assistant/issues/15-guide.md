# 15: The Guide

**What to build:** A first-time Visitor isn't faced with a wall of text. The steps bar under the top bar is replaced by the Guide: one callout at a time, anchored to the thing to look at, saying what to do next. It walks the whole loop and ends with the Visitor seeing an Employee answered from their own article.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] The steps bar is gone. Each callout is anchored to its target with an arrow, and the target gets a pulsing ring (no pulse under `prefers-reduced-motion`). Nothing is dimmed or blocked, so the rest of the page stays usable.
- [x] Every callout shows "N of 6" and **Skip guide**. A skip is remembered in this browser, Start over clears it, and a **Guide** button next to Start over brings the Guide back.
- [x] When a step starts, its target scrolls into view if it's out of sight.
- [x] The six steps, their targets, and their text:
  1. On the Gap Suggested question: "You're an Employee. Ask this one. The Help articles don't cover it." After the answered or Off topic Suggested question: "That one had an answer. Try this one." A typed question that becomes a Gap also completes this step.
  2. On the first Open Gap group that includes the Visitor's question: "You're the IT team now. Your question joined others asking the same thing. Open the group."
  3. On **Draft article**: "Have the AI write the missing article from these questions." While it runs: "Writing the draft…"
  4. On **Fill from IT notes**: "The AI marked facts it couldn't source. Fill them from the IT team's notes." If placeholders remain after filling, on them: "The notes don't have this one. Type the fact into the article." Done when no placeholders are left, however they were filled.
  5. On **Approve**: "Every fact is filled in. Approve it so Employees get answers from it."
  6. On the Employee input, pre-filled with the Visitor's Gap question so it's asked live rather than from the saved answer: "Ask your question again as an Employee." Done when a question asked after approval cites the Visitor's approved article. Then, on that answer: "Answered from your article. That's the loop." with **Close**. If the answer is a Gap: "It missed this time. Try rewording."
- [x] Progress comes from the Visitor's data, so a reload resumes at the right step and a later step ticks off the ones before it. Opening a group isn't saved, so after a reload step 2 points at the group again. A Visitor who approved an article before the Guide existed starts at step 6.
- [x] Off the path: on a phone, when the target is on the other tab, the callout points at the **Employee** or **IT team** tab. When the Dashboard is open, it points at the **Gap groups** tab. Otherwise a callout whose target isn't on screen hides until the target is back.
- [x] Callouts are positioned with CSS anchor positioning, as ⓘ is, without a tour library, and flip to stay on screen on a phone.
- [x] The current-step logic is a pure function with unit tests: skipping ahead, a reload resetting step 2, step 4's done rule, and step 6's done and missed rules.
- [ ] Sebastian has checked the Guide by hand on a desktop browser and a phone.
