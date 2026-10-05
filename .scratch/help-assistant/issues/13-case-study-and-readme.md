# 13: Case study page and README

**What to build:** A hiring manager clicking the resume link lands on a case study page that explains the project in seconds and opens the live demo. The repo is ready to go public with a README. The case study page is built in Sebastian's personal-site repo, not this one.

**Blocked by:** 11 (Test set and the two resume numbers)

**Status:** ready-for-agent

- [x] The page lives at `sebastianbrookes.com/projects/help-assistant`.
- [x] It has the headline, the three-panel strip, **Try the live demo**, and the static How it works diagram (version E: the Employee side on top, the IT team side below, and IT team notes feeding only the Draft article).
- [x] It has a How it was tested section with the two resume numbers, any tracked measures, the caveats (fake data, Didn't help excluded, lowest of 3), and links to the results files.
- [x] It has a How I built it section (what Sebastian specified and checked versus what the AI wrote) and links to the GitHub repo and the resume.
- [x] This repo has a short README.

## Comments

**2026-10-04, build:** The page is in the Portfolio repo (`~/Code/Portfolio`) at `app/projects/help-assistant/`. `page.mdx` has the copy and the results table. `panel-strip.tsx` has the three-panel strip and the **Try the live demo** button, and `how-it-works.tsx` draws the version E diagram as HTML boxes over an SVG arrow layer, so it works in light and dark mode. `ProjectReportLayout`'s hero image is now optional, since this page leads with the strip instead. The commit is local and not pushed, so the page goes live when Sebastian pushes the Portfolio repo.

Choices to check:
- The How I built it section speaks for Sebastian. It claims only what the tickets record: the design decisions, the hand check on phone and desktop (10), trying Fill from IT notes locally (05), and running the Test set (11). It says he didn't review the articles or notes (02's skim was waived) and didn't read the answers (11).
- The page uses summary.md's percentages, which round down (68/74 is 91.9%, shown as 91%).
- The Fill from IT notes row shows the strict 3/11 and explains the agent's 10/11 reading in the caveats.
- On phones the diagram scrolls sideways, with a one-line hint.
- The site's home page and Projects list don't link the page yet. The resume link is the way in.
