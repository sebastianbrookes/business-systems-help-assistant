# 14: UI polish

**What to build:** A running list of small UI fixes Sebastian notices while using the demo. Add each one as a checkbox when it's found, and tick it once it's fixed and checked in a browser on desktop and phone.

**Blocked by:** None (can start immediately)

**Status:** needs-triage

- [x] ⓘ opens a popover under the icon instead of making the top bar taller. Escape, a click outside, or a second click on ⓘ closes it.
- [x] ⓘ no longer says the demo was built with AI-assisted coding (2026-10-04). Ticket 09's last checkbox and spec story 10 still say it should, so update them or move that line to the case study's How I built it section (ticket 13).
- [x] Drafting or approving moves a group down the list (Open → Drafted → Resolved), so it looked like it disappeared. If the group is open, the list now scrolls to its new spot and it flashes. On phones the scroll stops below the sticky tabs.
- [x] [Check: …] placeholders in a draft's article text are highlighted amber so they stand out. The highlight follows edits, and the article box grows with its text instead of scrolling.
- [x] The Gap groups list can be filtered by state: All, Open, Drafted, or Resolved, each with a count. A group that's open stays listed when drafting or approving moves it out of the filter, and a new Gap resets the filter to All so its flash is seen.
- [x] A new answer lands at the bottom of the Northwake Help list, out of view after clicking a Suggested question. The list now scrolls the new answer into view when it arrives and flashes it, like a Gap group.
- [x] ~~Steps under the top bar walk a Visitor through the loop (ask a Gap question, open its group, draft, approve) and tick off as they go. On a phone only the current step shows. Replaces the "try this one" and "Next: draft the missing article" hints (2026-10-04).~~ Replaced by the Guide, ticket 15 (2026-10-05).
- [ ] Gap groups are listed in Drafted, Open, and Resolved sections instead of by filter chips and a state badge on every row. Replaces the filters above.
- [ ] Opening a Gap group shows it on its own in the IT team panel, with "← All Gap groups" to go back. Back focuses the group, wherever drafting or approving moved it. Replaces the scroll-and-flash after a group moves.
- [x] A Suggested question answered instantly, which gave away the saved answer. It now shows "Thinking…" for about 2 seconds first, like a typed question (2026-10-05).
