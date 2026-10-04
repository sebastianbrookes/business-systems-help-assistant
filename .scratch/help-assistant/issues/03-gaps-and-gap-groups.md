# 03: Gaps and Gap groups

**What to build:** When the Help articles fall short, the Employee gets no guessed answer. They're told the question went to the IT team, and they see the closest related articles and the team to contact. A Gap is logged with its reason. A grouping call puts each Gap into an existing Gap group or starts a new one. The IT team panel, on the right side of the desktop split screen, lists Gap groups with their question counts. Each Visitor sees the starting data plus only their own activity.

**Blocked by:** 01 (First answered question)

**Status:** ready-for-agent

- [x] The answer call can return No match (no article is about the question) or Not covered (an article is about it but doesn't answer it).
- [x] A partly covered question gets the covered part answered, says what isn't covered, and logs a Not covered Gap.
- [x] On a Gap, the Employee sees the "sent to the IT team" message, the closest related articles, and the team to contact.
- [x] Every answer has a Didn't help button. Clicking it logs a Gap with the reason Didn't help.
- [x] A grouping call, which runs only on Gaps, places the Gap in one of the Visitor's visible Gap groups or names a new one. It counts as part of the question, not as a separate call.
- [x] The IT team panel lists Gap groups with question counts. Opening a group shows its questions and their Gap reasons.
- [x] A Visitor never sees another Visitor's questions, Gaps, or groups. A group's count is its starting questions plus the Visitor's own.
- [x] Tests cover each Gap reason, partly covered questions, Didn't help, grouping into an existing or new group, and privacy between two Visitors.

## Comments

**2026-10-03, implementation:** All boxes are met in code. `convex/questions.test.ts` covers each Gap reason, a partly covered question, Didn't help, grouping into a new or existing group, and privacy between two Visitors. The grouping call is in `convex/groupGap.ts`, and the Gap group queries are in `convex/gapGroups.ts`. The IT team panel is the right half of a split screen, and it stacks below the Employee panel on narrow screens until ticket 09 adds tabs.

Decisions to know before 04, 06, 07, and 08:
- **Didn't help** sets the question's Didn't help flag and puts it in a Gap group. The outcome stays answered, and the IT team sees the reason Didn't help. The answer and cited articles are kept, so 04 can find the article that didn't help. (Changed on 2026-10-04 at Sebastian's request; see below.)
- The button shows only on answered questions. A Gap has already gone to the IT team.
- Gap groups don't store the article being revised yet. 04 can add it or work it out from the group's Didn't help questions.
- The answer and its grouping are saved together after both calls succeed. If either reply is malformed, nothing is saved. 06 will need to save the question first so it can mark it paused.
- The grouping call sees group titles only. Revisit if the "Gaps grouped correctly" measure is weak.
- A Gap may cite no article, as the spec allows. The Employee is then told to contact the IT Service Desk.

Checked on the dev deployment against `openai/gpt-6-luna`. Two phrasings of the Cambridge-to-Durham samples hole joined one group, the Durham parking question started its own, Didn't help on the MFA answer started "Setting up MFA on a new phone", and another Visitor saw none of these groups. The cell-line phrasing came back Not covered rather than No match. That's answer-call tuning for later, and any Gap reason still flags a known gap.

**2026-10-04, Didn't help flag:** Sebastian pointed out that a Didn't help click can mean the AI worded a good article badly rather than a real gap in knowledge. Didn't help now sets a separate flag and leaves the outcome as answered, which matches the spec's data model. The click still joins a Gap group, since the out-of-date MFA and badge access articles can only be found that way. When the IT team opens a group, each Didn't help question shows the answer it got, so they can tell bad wording from missing or stale knowledge before drafting. A review step before grouping was considered and turned down: it would hide the two out-of-date holes behind an extra click and add a review queue to the core loop. Three old Didn't help rows on the dev deployment were migrated to the flag.
