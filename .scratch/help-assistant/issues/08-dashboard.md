# 08: Dashboard

**What to build:** The IT team's Dashboard tab shows what Employees ask and where the docs fall short. The counts include the Visitor's own questions. The chart is third on the cut list. The four numbers stay.

**Blocked by:** 03 (Gaps and Gap groups)

**Status:** ready-for-agent

- [x] The IT team panel has **Gap groups** (default) and **Dashboard** tabs.
- [x] Four numbers: questions in the last 30 days, % answered from a Help article, Open Gap groups, and Resolved Gap groups.
- [x] A chart of questions by system, with each bar split into answered and Gap.
- [x] Counts combine starting data and the Visitor's own questions, never another Visitor's.
- [x] Tests cover the four numbers changing after a Visitor's answered question and Gap.

## Comments

**2026-10-04, implementation:** All boxes are met. `convex/dashboard.test.ts` covers the four numbers changing after a Visitor's answered question and Gap, an approval moving a group from Open to Resolved, the chart's answered/Gap split (Didn't help counting as a Gap), Off topic and paused questions left out, another Visitor's activity never counting, and a question leaving the 30-day window.

How it works: `api.dashboard.get` in `convex/dashboard.ts` reads starting data plus the Visitor's own rows, using the same visibility helpers and group states as the Gap groups tab. The IT team panel has **Gap groups** (default) and **Dashboard** tabs. The chart is plain HTML bars in `src/Dashboard.tsx`.

Choices to check:
- Question counts, the %, and the chart cover the last 30 days and leave out Off topic and paused questions. Every counted question was either answered or is a Gap, so the % and the chart bars share one base. The starting history has 140 such questions in the window, 81% answered.
- A Didn't help question counts as a Gap, not answered.
- Open and Resolved Gap group counts are not windowed. Drafted groups count in neither.
- Questions the model didn't tag with a system go in a last **No system** bar. The starting history has 8 of them, all Gaps. Leaving them out would hide about a third of the Gaps.
- Starting history counts back from today, so it never leaves the window. Only a Visitor's own questions age out.
