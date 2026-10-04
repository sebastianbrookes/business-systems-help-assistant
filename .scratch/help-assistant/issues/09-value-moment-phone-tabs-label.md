# 09: The value moment, phone tabs, and demo label

**What to build:** The first minute lands. On desktop, the Visitor's Gap visibly joins an existing Gap group, and a hint points to the Draft article. On a phone, Employee | IT team tabs with a badge do the same job. The demo is labeled as fake everywhere.

**Blocked by:** 07 (Starting history, starting Gap groups, and Suggested questions)

**Status:** ready-for-agent

- [x] When a Visitor's Gap joins a group, the group flashes and shows "N questions · incl. yours".
- [x] The first time, the group shows the hint "Next: draft the missing article →".
- [x] On phones the demo shows **Employee | IT team** tabs. After a Gap, the IT team tab shows a "1 new Gap" badge.
- [x] A single label line reads "DEMO · fictional company, fake data · ⓘ" on phones and desktop. ⓘ says the demo was built with AI-assisted coding, the Visitor's activity is private, and it isn't affiliated with any vendor.
- [x] A thin header has "← How it works" linking to the case study page.
- [ ] Sebastian has checked the flow by hand on a desktop browser and a phone.

## Comments

**2026-10-04, implementation:** All boxes are met except the hand check, which is Sebastian's. `convex/gapGroups.test.ts` covers the Suggested Gap question joining the samples group as "5 questions · incl. yours" with the hint, other Visitors never seeing either, and the hint going away once the Visitor drafts. I checked the flow in a browser at desktop and iPhone 12 Pro sizes against the dev deployment.

How it works: `api.gapGroups.list` now returns `includesYours` and `draftHint` for each group. The flash and the phone badge are worked out in the browser by `src/useNewGaps.ts`. It counts the Visitor's Gaps from after the page loaded that the IT team panel hasn't shown yet. When the panel is in view, it flashes their groups for 2.5 seconds and scrolls them into view.

Choices to check:
- The hint shows on every Open group that holds one of the Visitor's Gaps, until the Visitor drafts any article. A first-time Visitor usually has one such group. It stays after a reload and comes back after Start over.
- Clicking the hint opens the group, where **Draft article** sits.
- On desktop each side scrolls on its own, so the IT team's groups stay in view while the Employee side grows.
- A new Gap switches the IT team panel from Dashboard back to Gap groups, so the flash is seen.
- On a phone the hidden tab is kept in the page, not removed, so a question still being answered isn't lost when the Visitor switches tabs.
- The ⓘ text names the six vendors. It says other Visitors never see the Visitor's activity and that Sebastian can review saved activity.
- "← How it works" links to `https://sebastianbrookes.com/projects/help-assistant`, which doesn't exist until ticket 13.
