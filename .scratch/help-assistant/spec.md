# Spec: AI Help Assistant for Business Systems

Status: ready-for-agent

Vocabulary follows `GLOSSARY.md`. The one-page summary in `SPEC.md` is local only and gitignored. Where the two disagree, this file wins.

## Problem Statement

Sebastian is applying for IT business systems and AI co-ops. The roles ask for three things: AI-assisted workflows, finding gaps in documentation, and dashboards. His resume has no project that shows those three things together for business systems. A hiring manager who clicks a resume link should see something live, real, and plainly relevant within a minute. A recruiter who doesn't click should still get the point from the headline. Every number on the resume has to come from a measured test, and the project has to be open about being built with AI.

## Solution

A live demo helpdesk for Northwake Therapeutics, a fictional biotech of about 450 people in Cambridge, MA and Durham, NC. Northwake runs six business systems: Coupa, Concur, Workday, Ironclad, ServiceNow, and Microsoft 365.

On the Employee side, a Visitor asks a "how do I…?" question. The assistant does one of three things:
- answers from Help articles and names its source
- logs a Gap when the articles fall short
- politely declines an Off topic question

On the IT team side, the same Visitor sees Gaps gathered into Gap groups. They can have the AI write a Draft article, fill its [Check: …] placeholders, and approve it, after which it answers later questions. A Dashboard shows what Employees ask and where the docs fall short.

A case study page on Sebastian's site explains the project. It shows a static How it works diagram and test results measured on a fixed Test set. Its **Try the live demo** button opens the demo. Spending can't exceed the prepaid OpenRouter credit. When the money or a limit runs out, the demo still works through saved answers to the Suggested questions.

## User Stories

**Arriving**

1. As a hiring manager, I want the resume link to open a case study page with a one-line headline, so that I know what the project is before deciding to click further.
2. As a recruiter who won't open the demo, I want a three-panel strip showing the whole idea in pictures, so that I get the point in seconds. The panels show an Employee asking something the docs don't cover, the IT team seeing that 5 people asked the same thing, and the IT team approving an AI draft after filling in the facts.
3. As a hiring manager, I want a **Try the live demo** button with no sign-up, so that I can try it immediately.
4. As a hiring manager, I want a How it works diagram, so that I understand the loop without using the demo. The Employee side runs along the top and the IT team side along the bottom. IT team notes feed only the Draft article.
5. As a hiring manager, I want a How it was tested section, so that I can trust the numbers on the resume. It shows the two resume numbers, the tracked measures, the caveats, and links to the results files.
6. As a hiring manager, I want a How I built it section saying what Sebastian specified and checked and what the AI wrote, so that the use of AI is clear.
7. As a hiring manager, I want links to the public GitHub repo and the resume, so that I can dig deeper.
8. As Sebastian, I want the case study page on my own site, so that the resume link keeps working after the demo is shut down.

**Asking as an Employee**

9. As a Visitor, I want a single label reading "DEMO · fictional company, fake data · ⓘ", so that I never mistake this for a real company.
10. As a Visitor, I want ⓘ to explain that the demo was built with AI-assisted coding, that my activity is private, and that it isn't affiliated with any vendor, so that I know what I'm looking at.
11. As a Visitor, I want three Suggested questions, each with a hint saying what will happen and the Gap one marked "try this one", so that I can see the value without thinking up a question. One is answered, one is a Gap, and one is Off topic.
12. As a Visitor, I want to type my own question, so that I can test the assistant on something it wasn't primed for.
13. As an Employee, I want an answer drawn only from Help articles that names the article it came from, so that I can trust it and read more.
14. As an Employee, I want the answer to include the team to contact, so that I know who to ask when the steps don't work.
15. As an Employee whose question is only partly covered, I want the covered part answered and the missing part named, so that I get what exists without a guess.
16. As an Employee whose question isn't covered at all, I want to be told it went to the IT team, and to see the closest related articles and the team to contact, instead of a guessed answer.
17. As an Employee, I want a **Didn't help** button on every answer, so that I can report an answer that was wrong or out of date.
18. As an Employee who names a system Northwake doesn't use (for example, "submit my expense in Expensify"), I want an answer from the right Northwake article, not a Gap.
19. As a Visitor asking small talk or a lab-technique question, I want a polite decline, so that the assistant stays on business systems.
20. As a Visitor, I want each question answered on its own, so that what happens is easy to predict. There's no chat memory.

**Acting as the IT team**

21. As a Visitor on desktop, I want the Employee and IT team panels side by side, so that I can see my question land in a Gap group right away.
22. As a Visitor on a phone, I want **Employee | IT team** tabs, with a "1 new Gap" badge after my question becomes a Gap, so that I know where to look.
23. As a Visitor, I want my Gap to join an existing Gap group that flashes and shows "5 questions · incl. yours", so that I see repeats being grouped. That's the value moment.
24. As a first-time Visitor, I want a hint on that group, "Next: draft the missing article →", so that I know what to do next.
25. As the IT team, I want Gap groups listed with their state (Open, Drafted, Resolved) and question count, so that I can see which holes matter most.
26. As the IT team, I want to open a Gap group and read its questions and their Gap reasons (No match, Not covered, Didn't help), so that I understand what's missing.
27. As the IT team, I want a **Draft article** button on a Gap group, so that the AI writes the missing article from the Employees' questions, the related Help articles, and general knowledge.
28. As the IT team, I want a Didn't help group's draft to be a revision of the existing article, so that I fix the old article instead of adding a duplicate.
29. As the IT team, I want the Draft article to open right under its Gap group, not in a popup, so that I keep the context.
30. As the IT team, I want every company fact the AI couldn't source marked as a [Check: …] placeholder, so that the draft never invents company rules.
31. As the IT team, I want a **Fill from IT notes** button that fills placeholders only from the IT team notes and leaves the rest empty, so that I can approve quickly without the AI guessing.
32. As the IT team, I want to type into any remaining placeholder, so that I can supply facts the notes don't have, such as rDNA approval and CRO accruals.
33. As the IT team, I want approval blocked until no placeholders remain, so that unchecked facts never reach Employees.
34. As the IT team, I want an approved article to answer later questions, and its Gap group to become Resolved, so that I can see the loop close.
35. As the IT team, I want a Dashboard tab showing four numbers, so that I can see the overall picture: questions in the last 30 days, % answered from a Help article, Open Gap groups, and Resolved Gap groups.
36. As the IT team, I want a chart of questions by system, with each bar split into answered and Gap, so that I can see what Employees ask and where the docs fall short.
37. As a Visitor, I want my own questions included in the Dashboard counts, so that the Dashboard responds to what I do.
38. As a Visitor, I want the starting data to look like 8 weeks of real use that ends today, so that the demo doesn't look stale.
39. As a Visitor, I want to see the Resolved groups' history, with Gaps before the article was approved and answered questions after, so that the payoff is visible.

**Privacy, limits, and money**

40. As a Visitor, I want to see the starting data plus only my own activity, so that other Visitors' questions and drafts never show up.
41. As a returning Visitor on the same browser, I want my earlier activity still there, so that I can pick up where I left off.
41a. As a Visitor, I want a **Start over** button, so that I can see the demo as on a first visit. It asks me to confirm, and my earlier activity stays saved for Sebastian.
42. As Sebastian, I want every Visitor's activity saved, so that I can review it privately in the Convex dashboard.
43. As Sebastian, I want each Visitor limited to 15 AI calls a day, counting questions, Draft article clicks, and Fill from IT notes clicks, so that one person can't use up the budget.
44. As Sebastian, I want the whole app limited to 250 AI calls a day, so that a bot clearing its ID can't drain the credit in a day.
45. As a Visitor, I want Suggested questions to work from saved answers and saved grouping, so that they cost nothing, never count toward a limit, and always work.
46. As a Visitor who hits a limit, or arrives when the credit has run out, I want my typed question saved and a clear message to try a Suggested question, so that the demo still works.
47. As Sebastian, I want spending capped by OpenRouter, using $5 of prepaid credit, a $10 monthly limit on the demo key, and auto top-up off, so that the demo can never run up a bill.
48. As Sebastian, I want the model name kept in one setting, so that switching models is a one-line change.

**Measuring**

49. As Sebastian, I want a fixed Test set of 120 new questions, so that the resume numbers are honest. It has 74 answerable, 33 known-gap phrasings, and 13 Off topic, and Sebastian checks every answer key.
50. As Sebastian, I want a script that runs the Test set 3 times against a fresh copy of the starting data, separate from the live demo, and keeps the lowest score, so that one lucky run doesn't set the number.
51. As Sebastian, I want each run saved as a results file, plus a summary recording the date, model, article count, and every number, so that the resume bullet can cite it.
52. As Sebastian, I want the tracked measures and the Fill from IT notes check recorded, so that the case study page shows more than the two resume numbers. The tracked measures are correct Gap reason, false alarms, Off topic declined, and Gaps grouped correctly.

## Implementation Decisions

**Where it runs.** Vercel serves a Vite + React single-page app at `help.sebastianbrookes.com`. It holds no secrets and makes no AI calls. Convex holds all data, the OpenRouter key, the limits, and every AI call. OpenRouter runs `openai/gpt-6-luna`, named in one setting. The case study page is built in Sebastian's personal-site repo at `sebastianbrookes.com/projects/help-assistant`, not in this repo.

**Visitor identity.** The browser generates a random Visitor ID on the first visit, stores it, and sends it with every call. There is no login, no IP address, and no Turnstile.

**Data model.** Every row is either starting data (no Visitor ID) or belongs to one Visitor. A Visitor sees starting rows plus their own. The tables:
- **Help articles:** title, department, system, contact team, body. A revision points to the article it replaces. A Visitor's approved revision replaces the original in that Visitor's view only.
- **Questions:** text, answer, cited articles, outcome (answered, Gap, Off topic, or paused), Gap reason, department, system, Gap group, Didn't help flag, and time. Starting history stores "days ago" rather than a fixed date.
- **Gap groups:** a title and, for revision groups, the article being revised.
- **Draft articles:** Gap group, body, and status (pending or approved).
- **IT team notes:** about 25 facts.
- **Usage counters:** per Visitor per UTC day, and for the whole app per UTC day.

**Gap group state is derived, not stored.** For a given Visitor, a group is:
- **Resolved** if an approved Draft article exists for it, in starting data or from that Visitor
- **Drafted** if a pending Draft article exists
- **Open** otherwise

So when one Visitor drafts a starting group, it shows as Drafted only for them. A group's question count is its starting questions plus the Visitor's own.

**AI calls.** Each call returns structured JSON, and Convex checks it before saving anything. There are four calls:
- **Answer and tag**, on every typed question. The input is the question and every Help article the Visitor can see, which is about 14K tokens. The output is the answer text, the cited article IDs, the outcome, the Gap reason (No match or Not covered), the department, and the system. There's no search step. Every answer must cite at least one article, or else be a Gap or Off topic.
- **Gap grouping**, only when a Gap is logged, including a Didn't help click. The input is the Gap and the Visitor's visible Gap groups. The output is an existing group, or a new group title.
- **Draft article**, when the IT team clicks. The input is the group's questions and the related articles. The output is an article body with [Check: …] placeholders. A Didn't help group gets a revision.
- **Fill from IT notes**, when the IT team clicks. The input is the draft and the IT team notes. The output is the draft with only notes-backed placeholders filled.

IT team notes are never sent to the answer call.

**Order of checks on a typed question.**
1. Save the question.
2. Check the Visitor's daily limit and the app's daily limit.
3. Call the model.
4. If OpenRouter returns a 402 error or any limit is hit, mark the question paused and return the paused message.
5. Otherwise, save the result. On a Gap, run the grouping call. That call counts as part of the same question, not as a second call toward the limit.

**Suggested questions.** Each of the three has a saved answer and a saved Gap group. Asking one saves a question for the Visitor with that saved result and makes no AI call. The Gap one joins **Sending samples between Cambridge and Durham**.

**Approval.** It's rejected while the draft contains any [Check: …] placeholder. On approval, the draft becomes a Help article, or replaces the article it revises, in the Visitor's view.

**Starting data is generated once and committed.** Content is AI-drafted and Sebastian skims every piece. It includes:
- 36 Help articles with 14 holes left on purpose
- the IT team notes
- 7 starting Gap groups across all three states
- the saved Suggested question results

A one-off script runs about 300 history questions through the real assistant. It then adds Didn't help clicks on the two out-of-date articles, and Sebastian lightly adjusts the groups. The output is saved as seed files, so deploys and test copies load the same data without new AI calls. The full lists are in `wayfinder/tickets/05-fictional-company-and-data.md` and `research/biotech-ga-systems-and-questions.md`, which are local only.

**UI.**
- **Desktop:** a split screen with the Employee on the left and the IT team on the right. The IT team side has **Gap groups** (default) and **Dashboard** tabs. A thin header has "← How it works" linking back to the case study.
- **Phones:** **Employee | IT team** tabs with the "1 new Gap" badge.
- **Value moment:** the group flash and the first-time hint.
- **Dashboard:** the four numbers and the questions-by-system chart, computed from starting data plus the Visitor's own rows.

**Test runner.** A script outside the app runs against a separate Convex deployment loaded with a fresh copy of the starting data. It asks the Test set questions in a fixed order and scores them with no AI grading.
- **Correct article:** for answerable questions, the expected article is among those cited and no Gap is logged.
- **Known gaps flagged:** for known-gap questions, any Gap reason counts.

It also records the tracked measures and the Fill from IT notes check across the 11 known gaps. Results files and the summary are committed.

## Testing Decisions

- **One seam:** the Convex functions the browser calls, tested with `convex-test` in Vitest. Tests check only what those functions return and what a later query shows. They don't check internal helpers, prompt text, or table layout.
- **Faking OpenRouter:** tests stub `fetch`, so no other seam is added. The fake returns a set answer, a Gap, Off topic, malformed JSON, or a 402 error.
- **Faking the clock:** tests fake the time for daily limits and "days ago" history.
- **What gets tested:**
  - an answer cites an article
  - a partly covered question logs a Not covered Gap
  - a Gap joins a group, and the counts include the Visitor
  - Off topic is never a Gap
  - Didn't help logs a Gap
  - Suggested questions make no AI call and use no limit
  - a Visitor sees only their own activity, and derived group states differ between Visitors
  - approval is blocked while placeholders remain, and an approved article is used for later answers
  - the per-Visitor and app limits, and the paused message on a 402
  - malformed model output is rejected without saving a half-finished question
- **Not unit-tested:** the React UI, which Sebastian checks by hand on desktop and phone. The Test set run is a measurement, not a unit test.
- **Prior art:** none. The repo has no code yet.

## Out of Scope

- **Resume edit:** adding the entry to the resume, which happens after the app is live and the Test set numbers exist.
- **Other application work:** the tracker entry and the cover letter.
- **Features not planned:** chat memory, keyword or vector search, opening tickets, real login, and anything that publishes without IT team approval.
- **Operations:** keeping the demo running after about December 2026.

## Further Notes

- **Time budget:** 5–7 days. The tickets' blocking edges set the build order. If the build runs late, cut first the tracked measures beyond the two resume numbers, then Fill from IT notes, then the Dashboard chart. Never cut the answer → Gap → Gap group → Draft article → approval loop, the Suggested questions, the phone tabs, or the test run.
- **Test set rules:** write the Test set after the app is finished. Tune prompts only on the history and practice questions. Fixing failures means writing a fresh Test set.
- **Account setup:** Convex, Vercel, OpenRouter credit and keys, and the `help.` subdomain are steps only Sebastian can do. Use `/wizard` when a ticket reaches them.
- **Planning record:** the one-page summary, the map, its research, and the prototypes are kept locally in `SPEC.md`, `wayfinder/`, `research/`, and `prototypes/`, which are all gitignored.
