import { expect, test } from "vitest";
import { api } from "./_generated/api";
import {
  fakeModelReply,
  setup,
  setupWithHistory,
  useTestEnv,
} from "./test.helpers";

const visitorId = "visitor-1";
const SAMPLES = "Sending samples between Cambridge and Durham";

useTestEnv();

const gap = {
  outcome: "gap",
  answer: "The Help articles don't cover this.",
  citedArticleIds: [],
  gapReason: "noMatch",
  department: "Ops",
  system: "ServiceNow",
};

test("the Suggested Gap question joins a starting group, which shows the Visitor's question", async () => {
  const t = await setupWithHistory();
  const [, suggestedGap] = await t.query(api.questions.suggested, {});

  await t.mutation(api.questions.askSuggested, {
    visitorId,
    suggestedQuestionId: suggestedGap._id,
  });

  const groups = await t.query(api.gapGroups.list, { visitorId });
  expect(groups.find((g) => g.title === SAMPLES)).toMatchObject({
    questionCount: 5,
    includesYours: true,
    ownDraft: false,
  });
  for (const g of groups.filter((g) => g.title !== SAMPLES)) {
    expect(g).toMatchObject({ includesYours: false, ownDraft: false });
  }
  const other = await t.query(api.gapGroups.list, { visitorId: "visitor-2" });
  for (const g of other) {
    expect(g).toMatchObject({ includesYours: false, ownDraft: false });
  }
});

test("each group shows whether its Draft article is the Visitor's own, through approval", async () => {
  const { t, addStartingGroup } = await setup();
  const samples = await addStartingGroup(SAMPLES, ["How do I courier samples?"]);
  const parking = await addStartingGroup("Parking at the Durham site", [
    "Where do I park in Durham?",
  ]);
  const owned = async (id = visitorId) =>
    (await t.query(api.gapGroups.list, { visitorId: id }))
      .filter((g) => g.ownDraft)
      .map((g) => ({ _id: g._id, state: g.state }));

  fakeModelReply(gap, { gapGroupId: parking, newGroupTitle: null });
  await t.action(api.questions.ask, { visitorId, text: "Is there parking?" });
  expect(await owned()).toEqual([]);

  fakeModelReply({
    title: "Parking at the Durham site",
    department: "Ops",
    system: "ServiceNow",
    contactTeam: "Workplace & EHS",
    body: "Park in lot B.",
  });
  await t.action(api.draftArticles.draft, { visitorId, gapGroupId: parking });
  expect(await owned()).toEqual([{ _id: parking, state: "drafted" }]);

  await t.mutation(api.draftArticles.approve, { visitorId, gapGroupId: parking });
  expect(await owned()).toEqual([{ _id: parking, state: "resolved" }]);
  expect(await owned("visitor-2")).toEqual([]);
  expect(await t.query(api.gapGroups.list, { visitorId })).toMatchObject([
    { _id: samples, includesYours: false },
    { _id: parking, includesYours: true },
  ]);
});
