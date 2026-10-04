# 10: Go live

**What to build:** The demo is live at its own address with spending capped. Sebastian does the account and domain steps, using `/wizard` for them.

**Blocked by:** 06 (Limits and the paused state), 07 (Starting history, starting Gap groups, and Suggested questions), 08 (Dashboard), 09 (The value moment, phone tabs, and demo label)

**Status:** ready-for-agent

- [x] A production Convex deployment is loaded with the committed starting data.
- [x] The page is served by Vercel at `help.sebastianbrookes.com`.
- [x] OpenRouter has $5 of prepaid credit with auto top-up off. The demo key has a $10 monthly limit, and build and test scripts use a separate key.
- [x] Sebastian has checked the full flow on the live site from a phone and a desktop: a Suggested question, a typed question, a Gap, a draft, and an approval.

## Comments

**2026-10-04, sign-off:** Sebastian ran `scripts/go-live.sh`. Convex production holds the starting data and the demo's OpenRouter key, and a smoke-test question was answered on production. `vercel.json` makes each Vercel build run `convex deploy`, using a `CONVEX_DEPLOY_KEY` limited to Production. `https://help.sebastianbrookes.com` returns 200. Sebastian checked the full flow on a phone and a desktop.
