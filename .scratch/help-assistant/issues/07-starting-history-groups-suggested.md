# 07: Starting history, starting Gap groups, and Suggested questions

**What to build:** The demo looks like 8 weeks of real use that ends today. Seven starting Gap groups exist across all three states, and three Suggested questions work instantly at no cost. The history runs once through the real assistant, and the output is saved as seed files, so deploys and test copies load identical data without new AI calls.

**Blocked by:** 02 (Northwake's Help articles and IT team notes), 04 (Draft article and approval)

**Status:** ready-for-agent

- [ ] **Open groups:** Sending samples between Cambridge and Durham (4 questions), Using AI tools with company files, Moving MFA to a new phone (shows a revision draft), and Parking at the Durham site.
- [ ] **Drafted group:** Carrying over unused time off, a pending revision of the Workday article.
- [ ] **Resolved groups:** Laptop for a consultant (approved about 3 weeks ago) and Badge access (approved about 2 weeks ago). Each shows Gaps before approval and answered questions after.
- [ ] The remaining holes form small Open groups of 1–3 questions, below the four main ones.
- [ ] About 300 history questions have run once through the real assistant. The mix is about 70% answered, 20% Gaps, and 10% Off topic. By department it's Finance 30%, IT 25%, HR 20%, Ops 15%, and Legal 10%. There are no fake names. Didn't help clicks were added on answers from the two out-of-date articles.
- [ ] History is stored as "days ago" and always shows as the 8 weeks ending today.
- [ ] There are three Suggested questions, each with a hint saying what will happen. The answered one is "How do I order lab supplies from Fisher?" The Gap one, marked "try this one", is "Do I need an MTA to send samples to our Durham site?" The Off topic one is "What's a good blocking buffer for a Western blot?" Each uses a saved answer and saved grouping, with no AI call and no limit used.
- [ ] The Gap Suggested question joins the Sending samples group, which then shows 5 questions.
- [ ] The seed output is committed, and loading it needs no AI calls.
- [ ] Tests cover a Suggested question making no AI call and using no limit, and history dates moving with today.
