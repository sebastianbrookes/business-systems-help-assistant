# 04: Draft article and approval

**What to build:** The IT team closes the loop. On a Gap group, **Draft article** has the AI write the missing article, or a revision of the existing article for a Didn't help group. Company facts the AI can't source become [Check: …] placeholders. The draft opens under its Gap group. The Visitor fills the placeholders by typing and approves, and the approved article answers later questions. Group state (Open, Drafted, Resolved) is worked out per Visitor.

**Blocked by:** 03 (Gaps and Gap groups)

**Status:** ready-for-agent

- [ ] **Draft article** writes a draft from the group's questions, the related Help articles, and general knowledge. It opens under the group, not in a popup.
- [ ] Any company fact the AI can't source appears as a [Check: …] placeholder.
- [ ] A Didn't help group's draft is a revision of the article that didn't help.
- [ ] The Visitor can edit the draft and type into placeholders. Approval is rejected while any placeholder remains.
- [ ] An approved draft becomes a Help article, or replaces the article it revises, in that Visitor's view only. Later questions from that Visitor are answered from it.
- [ ] Group state is worked out per Visitor. It's Resolved if an approved article exists, Drafted if a pending draft exists, and Open otherwise. One Visitor drafting a starting group doesn't change it for anyone else.
- [ ] Tests cover blocked approval, approval, an approved article answering a later question, a revision replacing the original, and two Visitors seeing different states for the same starting group.
