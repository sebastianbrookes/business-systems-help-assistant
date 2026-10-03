# 11: Test set and the two resume numbers

**What to build:** The resume numbers are measured honestly. Write a fixed Test set after the app is finished and run it 3 times against a fresh copy of the starting data, separate from the live demo. Keep the lowest score of each number.

**Blocked by:** 10 (Go live)

**Status:** ready-for-agent

- [ ] The Test set has 120 questions that don't copy or closely reword the history questions. That's about 74 answerable (2 per article, about 10 naming the wrong system), 33 known-gap questions (3 phrasings of each of the 11 known gaps), and 13 Off topic.
- [ ] Sebastian writes about 20 in his own words and checks every answer key. An answer key can list more than one acceptable article.
- [ ] A separate Convex deployment is loaded with a fresh copy of the starting data for each run, and questions run in a fixed order.
- [ ] A script scores with no AI grading. **Correct article** means the expected article is cited and no Gap is logged. **Known gaps flagged** means a known-gap question gets a Gap with any reason.
- [ ] Each of the 3 runs saves a results file with every question, its answer key, the result, and pass/fail. A summary records the date, model, article count, both numbers (the lowest of 3), and Sebastian's spot-check note on about 20 answers.
- [ ] Results files and the summary are committed. The prompts weren't tuned on the Test set.
