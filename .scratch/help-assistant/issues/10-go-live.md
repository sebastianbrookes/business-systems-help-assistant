# 10: Go live

**What to build:** The demo is live at its own address with spending capped. Sebastian does the account and domain steps, using `/wizard` for them.

**Blocked by:** 06 (Limits and the paused state), 07 (Starting history, starting Gap groups, and Suggested questions), 08 (Dashboard), 09 (The value moment, phone tabs, and demo label)

**Status:** ready-for-agent

- [ ] A production Convex deployment is loaded with the committed starting data.
- [ ] The page is served by Vercel at `help.sebastianbrookes.com`.
- [ ] OpenRouter has $5 of prepaid credit with auto top-up off. The demo key has a $10 monthly limit, and build and test scripts use a separate key.
- [ ] Sebastian has checked the full flow on the live site from a phone and a desktop: a Suggested question, a typed question, a Gap, a draft, and an approval.
