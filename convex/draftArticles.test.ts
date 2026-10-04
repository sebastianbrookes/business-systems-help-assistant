import { expect, test } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { fakeModelReply, promptOf, setup, useTestEnv } from "./test.helpers";

const visitorId = "visitor-1";

useTestEnv();

const samplesDraft = {
  title: "Sending samples between Cambridge and Durham",
  department: "Ops",
  system: "ServiceNow",
  contactTeam: "Workplace & EHS",
  body: "Open a Sample Shipment request in ServiceNow. Shipments leave on [Check: which weekdays the courier runs].",
} as const;

const filledSamplesBody =
  "Open a Sample Shipment request in ServiceNow. Shipments leave on Tuesdays and Thursdays.";

/** Has the Visitor draft, fill, and approve the group's article. Returns the new Help article. */
async function draftAndApprove(
  t: Awaited<ReturnType<typeof setup>>["t"],
  gapGroupId: Id<"gapGroups">,
  reply: object = samplesDraft,
) {
  fakeModelReply(reply);
  await t.action(api.draftArticles.draft, { visitorId, gapGroupId });
  const { draft } = await t.query(api.gapGroups.get, { visitorId, gapGroupId });
  await t.mutation(api.draftArticles.save, {
    visitorId,
    gapGroupId,
    title: draft!.title,
    body: filledSamplesBody,
  });
  return t.mutation(api.draftArticles.approve, { visitorId, gapGroupId });
}

const answerCiting = (articleId: string) => ({
  outcome: "answered",
  answer: "Open a Sample Shipment request in ServiceNow.",
  citedArticleIds: [articleId],
  gapReason: null,
  department: "Ops",
  system: "ServiceNow",
});

async function setupSamplesGroup() {
  const s = await setup();
  const gapGroupId = await s.addStartingGroup(
    "Sending samples between Cambridge and Durham",
    ["How do I courier samples to Durham?", "Can I mail cell lines to NC?"],
  );
  return { ...s, gapGroupId };
}

test("Draft article opens a pending draft under its Gap group, which becomes Drafted", async () => {
  const { t, gapGroupId } = await setupSamplesGroup();
  expect(
    await t.query(api.gapGroups.get, { visitorId, gapGroupId }),
  ).toMatchObject({ state: "open", draft: null });
  fakeModelReply(samplesDraft);

  await t.action(api.draftArticles.draft, { visitorId, gapGroupId });

  expect(
    await t.query(api.gapGroups.get, { visitorId, gapGroupId }),
  ).toMatchObject({
    state: "drafted",
    draft: {
      status: "pending",
      title: "Sending samples between Cambridge and Durham",
      body: samplesDraft.body,
    },
  });
  expect(await t.query(api.gapGroups.list, { visitorId })).toMatchObject([
    { _id: gapGroupId, state: "drafted" },
  ]);
});

test("approval is rejected while a placeholder remains, and resolves the group once the Visitor fills it", async () => {
  const { t, gapGroupId } = await setupSamplesGroup();
  fakeModelReply(samplesDraft);
  await t.action(api.draftArticles.draft, { visitorId, gapGroupId });

  await expect(
    t.mutation(api.draftArticles.approve, { visitorId, gapGroupId }),
  ).rejects.toThrow(/placeholder/);
  expect(
    await t.query(api.gapGroups.get, { visitorId, gapGroupId }),
  ).toMatchObject({ state: "drafted" });

  await t.mutation(api.draftArticles.save, {
    visitorId,
    gapGroupId,
    title: samplesDraft.title,
    body: filledSamplesBody,
  });
  await t.mutation(api.draftArticles.approve, { visitorId, gapGroupId });

  expect(
    await t.query(api.gapGroups.get, { visitorId, gapGroupId }),
  ).toMatchObject({
    state: "resolved",
    draft: { status: "approved", body: filledSamplesBody },
  });
});

test("an approved article answers the Visitor's later questions, and no one else's", async () => {
  const { t, gapGroupId } = await setupSamplesGroup();
  const articleId = await draftAndApprove(t, gapGroupId);

  fakeModelReply(answerCiting(articleId));
  await t.action(api.questions.ask, {
    visitorId,
    text: "How do I send samples to Durham?",
  });

  expect(await t.query(api.questions.list, { visitorId })).toMatchObject([
    {
      outcome: "answered",
      citedArticles: [
        {
          title: "Sending samples between Cambridge and Durham",
          contactTeam: "Workplace & EHS",
        },
      ],
    },
  ]);

  fakeModelReply(answerCiting(articleId));
  await expect(
    t.action(api.questions.ask, {
      visitorId: "visitor-2",
      text: "How do I send samples to Durham?",
    }),
  ).rejects.toThrow(/unusable reply/);
});

test("a Didn't help group's draft revises the article that didn't help, replacing it for that Visitor only", async () => {
  const { t, articleId } = await setup();
  const mfa = await articleId("Moving MFA to a new phone");
  const mfaAnswer = {
    ...answerCiting(mfa),
    answer: "Text the code sent by SMS to your new number.",
    department: "IT",
    system: "Microsoft 365",
  };
  fakeModelReply(mfaAnswer, {
    gapGroupId: null,
    newGroupTitle: "MFA codes no longer come by SMS",
  });
  const questionId = await t.action(api.questions.ask, {
    visitorId,
    text: "How do I set up MFA on my new phone?",
  });
  await t.action(api.questions.didntHelp, { visitorId, questionId });
  const [group] = await t.query(api.gapGroups.list, { visitorId });
  expect(
    await t.query(api.gapGroups.get, { visitorId, gapGroupId: group._id }),
  ).toMatchObject({ revisesArticle: { title: "Moving MFA to a new phone" } });

  const fetch = fakeModelReply({
    title: "Setting up Microsoft Authenticator",
    department: "IT",
    system: "Microsoft 365",
    contactTeam: "IT Service Desk",
    body: "Open Microsoft Authenticator on your old phone and choose Move to new device.",
  });
  await t.action(api.draftArticles.draft, {
    visitorId,
    gapGroupId: group._id,
  });
  expect(promptOf(fetch)).toContain("SMS");
  const revision = await t.mutation(api.draftArticles.approve, {
    visitorId,
    gapGroupId: group._id,
  });

  // The original can no longer be cited by this Visitor, and the revision keeps its title.
  fakeModelReply(mfaAnswer);
  await expect(
    t.action(api.questions.ask, { visitorId, text: "How do I move MFA?" }),
  ).rejects.toThrow(/unusable reply/);
  fakeModelReply({ ...mfaAnswer, citedArticleIds: [revision] });
  await t.action(api.questions.ask, { visitorId, text: "How do I move MFA?" });
  expect(
    (await t.query(api.questions.list, { visitorId })).at(-1),
  ).toMatchObject({ citedArticles: [{ title: "Moving MFA to a new phone" }] });

  fakeModelReply(mfaAnswer);
  await t.action(api.questions.ask, {
    visitorId: "visitor-2",
    text: "How do I move MFA?",
  });
  expect(
    await t.query(api.questions.list, { visitorId: "visitor-2" }),
  ).toMatchObject([{ citedArticles: [{ _id: mfa }] }]);
});

test("two Visitors see different states for the same starting group", async () => {
  const { t, gapGroupId } = await setupSamplesGroup();
  const other = "visitor-2";
  const stateFor = async (id: string) =>
    (await t.query(api.gapGroups.get, { visitorId: id, gapGroupId })).state;

  fakeModelReply(samplesDraft);
  await t.action(api.draftArticles.draft, { visitorId, gapGroupId });
  expect([await stateFor(visitorId), await stateFor(other)]).toEqual([
    "drafted",
    "open",
  ]);

  await t.mutation(api.draftArticles.save, {
    visitorId,
    gapGroupId,
    title: samplesDraft.title,
    body: filledSamplesBody,
  });
  await t.mutation(api.draftArticles.approve, { visitorId, gapGroupId });
  expect([await stateFor(visitorId), await stateFor(other)]).toEqual([
    "resolved",
    "open",
  ]);
  expect(
    await t.query(api.gapGroups.get, { visitorId: other, gapGroupId }),
  ).toMatchObject({ draft: null });
});

test("editing and approving a starting draft changes it for that Visitor only", async () => {
  const { t, gapGroupId } = await setupSamplesGroup();
  await t.run((ctx) =>
    ctx.db.insert("draftArticles", {
      gapGroupId,
      ...samplesDraft,
      status: "pending",
    }),
  );
  const other = "visitor-2";

  await t.mutation(api.draftArticles.save, {
    visitorId,
    gapGroupId,
    title: samplesDraft.title,
    body: filledSamplesBody,
  });
  await t.mutation(api.draftArticles.approve, { visitorId, gapGroupId });

  expect(
    await t.query(api.gapGroups.get, { visitorId, gapGroupId }),
  ).toMatchObject({
    state: "resolved",
    draft: { status: "approved", body: filledSamplesBody },
  });
  expect(
    await t.query(api.gapGroups.get, { visitorId: other, gapGroupId }),
  ).toMatchObject({
    state: "drafted",
    draft: { status: "pending", body: samplesDraft.body },
  });
});

test("a group that already has a draft can't be drafted again", async () => {
  const { t, gapGroupId } = await setupSamplesGroup();
  fakeModelReply(samplesDraft);
  await t.action(api.draftArticles.draft, { visitorId, gapGroupId });

  const fetch = fakeModelReply(samplesDraft);
  await expect(
    t.action(api.draftArticles.draft, { visitorId, gapGroupId }),
  ).rejects.toThrow(/already has a Draft article/);
  expect(fetch).not.toHaveBeenCalled();
});

test("a later Gap can't join a Resolved group", async () => {
  const { t, gapGroupId, articleId } = await setupSamplesGroup();
  await draftAndApprove(t, gapGroupId);
  const mta = await articleId(
    "Requesting a material transfer agreement (MTA) in Ironclad",
  );
  const gap = {
    outcome: "gap",
    answer: "The Help articles don't say who pays for courier shipments.",
    citedArticleIds: [mta],
    gapReason: "noMatch",
    department: "Ops",
    system: "ServiceNow",
  };

  fakeModelReply(gap, { gapGroupId, newGroupTitle: null });
  await expect(
    t.action(api.questions.ask, {
      visitorId,
      text: "Who pays for couriers to Durham?",
    }),
  ).rejects.toThrow(/unusable reply/);
});

test("revising an article the Visitor already revised replaces their latest version", async () => {
  const { t, articleId } = await setup();
  const mfa = await articleId("Moving MFA to a new phone");
  const mfaAnswer = { ...answerCiting(mfa), department: "IT", system: "Microsoft 365" };
  const mfaRevision = {
    title: "Setting up Microsoft Authenticator",
    department: "IT",
    system: "Microsoft 365",
    contactTeam: "IT Service Desk",
    body: "Open Microsoft Authenticator and choose Move to new device.",
  };
  /** Asks an MFA question and clicks Didn't help, which starts a new revision group. */
  const didntHelpGroup = async (title: string) => {
    fakeModelReply(mfaAnswer, { gapGroupId: null, newGroupTitle: title });
    const questionId = await t.action(api.questions.ask, {
      visitorId,
      text: "How do I move MFA?",
    });
    await t.action(api.questions.didntHelp, { visitorId, questionId });
    const groups = await t.query(api.gapGroups.list, { visitorId });
    return groups.find((g) => g.title === title)!._id;
  };
  const first = await didntHelpGroup("MFA codes no longer come by SMS");
  const second = await didntHelpGroup("MFA on a phone without the old one");

  const firstRevision = await draftAndApprove(t, first, mfaRevision);
  fakeModelReply(mfaRevision);
  await t.action(api.draftArticles.draft, { visitorId, gapGroupId: second });
  const secondRevision = await t.mutation(api.draftArticles.approve, {
    visitorId,
    gapGroupId: second,
  });

  fakeModelReply({ ...mfaAnswer, citedArticleIds: [firstRevision] });
  await expect(
    t.action(api.questions.ask, { visitorId, text: "How do I move MFA?" }),
  ).rejects.toThrow(/unusable reply/);
  fakeModelReply({ ...mfaAnswer, citedArticleIds: [secondRevision] });
  await t.action(api.questions.ask, { visitorId, text: "How do I move MFA?" });
  expect(
    (await t.query(api.questions.list, { visitorId })).at(-1),
  ).toMatchObject({ citedArticles: [{ title: "Moving MFA to a new phone" }] });
});
