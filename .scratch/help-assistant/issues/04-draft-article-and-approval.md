# 04: Draft article and approval

**What to build:** The IT team closes the loop. On a Gap group, **Draft article** has the AI write the missing article, or a revision of the existing article for a Didn't help group. Company facts the AI can't source become [Check: …] placeholders. The draft opens under its Gap group. The Visitor fills the placeholders by typing and approves, and the approved article answers later questions. Group state (Open, Drafted, Resolved) is worked out per Visitor.

**Blocked by:** 03 (Gaps and Gap groups)

**Status:** ready-for-agent

- [x] **Draft article** writes a draft from the group's questions, the related Help articles, and general knowledge. It opens under the group, not in a popup.
- [x] Any company fact the AI can't source appears as a [Check: …] placeholder.
- [x] A Didn't help group's draft is a revision of the article that didn't help.
- [x] The Visitor can edit the draft and type into placeholders. Approval is rejected while any placeholder remains.
- [x] An approved draft becomes a Help article, or replaces the article it revises, in that Visitor's view only. Later questions from that Visitor are answered from it.
- [x] Group state is worked out per Visitor. It's Resolved if an approved article exists, Drafted if a pending draft exists, and Open otherwise. One Visitor drafting a starting group doesn't change it for anyone else.
- [x] Tests cover blocked approval, approval, an approved article answering a later question, a revision replacing the original, and two Visitors seeing different states for the same starting group.

## Comments

**2026-10-04, implementation:** All boxes are met in code. `convex/draftArticles.test.ts` covers drafting, blocked approval, approval, an approved article answering a later question, a revision replacing the original, and per-Visitor state, including a starting draft. The Draft article call is in `convex/writeDraft.ts`, while drafting, saving, and approval are in `convex/draftArticles.ts`. The editor opens inside the expanded Gap group. It lists the placeholders still left, and Approve stays disabled until none remain.

Decisions to know before 05, 06, and 07:

- A Visitor sees one draft per group: their own, or else a starting draft. Saving or approving a starting draft copies it to the Visitor first, so starting rows never change. `save` and `approve` take the Gap group, not a draft ID.
- **Draft article** works only on an Open group. The grouping call no longer offers Resolved groups, so a later Gap on the same topic starts a new group that the IT team can act on.
- A revision group stores `revisesArticleId`. A new group started by a Didn't help click revises the first article that answer cited. A Didn't help Gap that joins an existing group doesn't turn that group into a revision group. Ticket 07 must set `revisesArticleId` on the starting MFA and time-off groups.
- A revision keeps the original's title, department, system, and contact team, though the Visitor can still edit the title. If the Visitor has already revised the article, the draft and the approval apply to their latest version, so the Help articles never contain two versions.
- Drafts store title, department, system, and contact team as well as body, because approval needs them to create the Help article.

Checked on the dev deployment against `openai/gpt-6-luna`. The MTA question started "Sending samples between Northwake sites". The draft came back with one placeholder on whether moves between sites need an MTA, and Approve stayed disabled until it was filled. After approval, the group showed Resolved, and the same question was answered from the new article.
