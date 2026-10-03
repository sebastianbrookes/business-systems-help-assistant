# 02: Northwake's Help articles and IT team notes

**What to build:** Northwake's real starting content is loaded. That means 36 Help articles covering Coupa, Concur, Workday, Ironclad, ServiceNow, and Microsoft 365, with the 14 holes left on purpose, plus about 25 IT team notes. A Visitor can ask about any of the six systems and get the right article.

The AI drafts the content and Sebastian skims every piece. The source material is in the local planning files listed in the spec's Implementation Decisions under "Starting data".

**Blocked by:** 01 (First answered question)

**Status:** ready-for-agent

- [x] 36 Help articles are loaded as starting data: Finance 10 (Coupa 5, Concur 5), HR 7, Legal 6, Ops 6, IT 7. Each has a title, department, system, steps, 1–3 made-up company rules, and a contact team, in 150–300 words.
- [x] The 14 holes are left on purpose. That's 8 No match, 4 Not covered, and 2 out-of-date articles (MFA still describes SMS codes, and badge access still says to email Facilities).
- [x] About 25 IT team notes are stored. They cover every hole except rDNA approval and CRO accruals, and they're never sent to the answer call.
- [x] A question that names a system Northwake doesn't use gets an answer from the right Northwake article, not a Gap. For example, Expensify gets the Concur article.
- [ ] Sebastian has skimmed every article and note.

## Comments

**2026-10-03, implementation:** The first four boxes are met. The articles are in `convex/startingArticles.ts`, and the 25 notes are in `convex/startingItTeamNotes.ts` (new `itTeamNotes` table). `seed:load` loads both. A test at the function seam checks that the answer call gets every article and no notes. The "skimmed" box waits on Sebastian.

The laptop article is tagged Microsoft 365, following the planning file. The planned rDNA and CRO accrual holes have no notes, and no other note can fill their placeholders.

Checked against `openai/gpt-6-luna` on the dev deployment. Expensify, SAP Ariba, BambooHR, DocuSign, Jira, and Google Drive questions were each answered from the right Northwake article. The first run showed two prompt problems: the rDNA question came back Off topic, and No match holes came back Not covered whenever a nearby article existed. The answer instructions now define the two Gap reasons more sharply and say company approvals for lab work are on topic. After that change, all 12 detectable holes got their planned reason (8 No match, 4 Not covered), Expensify still went to Concur, and the Western blot question stayed Off topic. These were practice questions; the Test set doesn't exist yet.

`seed:load` still loads only into an empty deployment. To replace ticket 01's 3 placeholder articles on dev, the `helpArticles` table was emptied with `pnpm exec convex import --replace` first.
