# 01: First answered question

**What to build:** The bare app works end to end. A Visitor opens the Vite + React page and types a question about one of a few sample Help articles. Convex sends the question and the articles to GPT-6 Luna through OpenRouter, then shows an answer that names the article it came from and the team to contact. An Off topic question gets a polite decline and is saved, but it's never a Gap. The browser creates a Visitor ID on the first visit and sends it with every call. Tests use `convex-test` and fake OpenRouter by stubbing `fetch`.

Sebastian creates the Convex and OpenRouter dev accounts and a build/test key. Use `/wizard` for those steps.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] The browser creates a Visitor ID on the first visit, stores it, and sends it with every call.
- [x] A typed question saves a question with its answer, the cited article(s), the department, and the system.
- [x] The Employee panel shows the answer, the article it came from, and the team to contact.
- [x] Off topic questions get a polite decline, are saved as Off topic, and log no Gap.
- [x] The model name lives in one setting. The OpenRouter key lives only in Convex.
- [x] Malformed model output is rejected, and no half-finished question is saved.
- [x] Tests at the Convex function seam cover an answered question, an Off topic question, and malformed output, with OpenRouter faked.

## Comments

**2026-10-03, implementation:** All boxes are met in code and covered by `convex/questions.test.ts`. Checked locally against an anonymous Convex deployment, but not yet against the real model. Sebastian still needs to run `scripts/setup-dev-accounts.sh` to create the Convex project and OpenRouter build/test key; its last stage asks one real question to confirm `openai/gpt-6-luna` works.
