# 03: Gaps and Gap groups

**What to build:** When the Help articles fall short, the Employee gets no guessed answer. They're told the question went to the IT team, and they see the closest related articles and the team to contact. A Gap is logged with its reason. A grouping call puts each Gap into an existing Gap group or starts a new one. The IT team panel, on the right side of the desktop split screen, lists Gap groups with their question counts. Each Visitor sees the starting data plus only their own activity.

**Blocked by:** 01 (First answered question)

**Status:** ready-for-agent

- [ ] The answer call can return No match (no article is about the question) or Not covered (an article is about it but doesn't answer it).
- [ ] A partly covered question gets the covered part answered, says what isn't covered, and logs a Not covered Gap.
- [ ] On a Gap, the Employee sees the "sent to the IT team" message, the closest related articles, and the team to contact.
- [ ] Every answer has a Didn't help button. Clicking it logs a Gap with the reason Didn't help.
- [ ] A grouping call, which runs only on Gaps, places the Gap in one of the Visitor's visible Gap groups or names a new one. It counts as part of the question, not as a separate call.
- [ ] The IT team panel lists Gap groups with question counts. Opening a group shows its questions and their Gap reasons.
- [ ] A Visitor never sees another Visitor's questions, Gaps, or groups. A group's count is its starting questions plus the Visitor's own.
- [ ] Tests cover each Gap reason, partly covered questions, Didn't help, grouping into an existing or new group, and privacy between two Visitors.
