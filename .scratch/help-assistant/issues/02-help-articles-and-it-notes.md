# 02: Northwake's Help articles and IT team notes

**What to build:** Northwake's real starting content is loaded. That means 36 Help articles covering Coupa, Concur, Workday, Ironclad, ServiceNow, and Microsoft 365, with the 14 holes left on purpose, plus about 25 IT team notes. A Visitor can ask about any of the six systems and get the right article.

The AI drafts the content and Sebastian skims every piece. The source material is in the local planning files listed in the spec's Implementation Decisions under "Starting data".

**Blocked by:** 01 (First answered question)

**Status:** ready-for-agent

- [ ] 36 Help articles are loaded as starting data: Finance 10 (Coupa 5, Concur 5), HR 7, Legal 6, Ops 6, IT 7. Each has a title, department, system, steps, 1–3 made-up company rules, and a contact team, in 150–300 words.
- [ ] The 14 holes are left on purpose. That's 8 No match, 4 Not covered, and 2 out-of-date articles (MFA still describes SMS codes, and badge access still says to email Facilities).
- [ ] About 25 IT team notes are stored. They cover every hole except rDNA approval and CRO accruals, and they're never sent to the answer call.
- [ ] A question that names a system Northwake doesn't use gets an answer from the right Northwake article, not a Gap. For example, Expensify gets the Concur article.
- [ ] Sebastian has skimmed every article and note.
