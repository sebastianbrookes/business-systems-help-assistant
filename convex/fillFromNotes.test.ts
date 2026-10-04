import { expect, test } from "vitest";
import { api } from "./_generated/api";
import {
  fakeModelReply,
  promptOf,
  setupWithHistory,
  useTestEnv,
} from "./test.helpers";

const visitorId = "visitor-1";
const TIME_OFF = "Carrying over unused time off";
const RDNA = "Getting approval for recombinant DNA work";

useTestEnv();

async function groupNamed(
  t: Awaited<ReturnType<typeof setupWithHistory>>,
  title: string,
  id = visitorId,
) {
  const groups = await t.query(api.gapGroups.list, { visitorId: id });
  const { _id } = groups.find((g) => g.title === title)!;
  return t.query(api.gapGroups.get, { visitorId: id, gapGroupId: _id });
}

test("Fill from IT notes fills only the placeholders the notes back, for that Visitor only", async () => {
  const t = await setupWithHistory();
  const group = await groupNamed(t, TIME_OFF);
  const fetch = fakeModelReply({
    fills: [
      { placeholder: 1, fact: "40 hours", noteNumber: 16 },
      { placeholder: 2, fact: "January 1", noteNumber: 16 },
      { placeholder: 3, fact: null, noteNumber: null },
    ],
  });

  const filled = await t.action(api.draftArticles.fill, {
    visitorId,
    gapGroupId: group._id,
  });

  const prompt = promptOf(fetch);
  expect(prompt).toContain("Up to 40 hours of unused vacation carry over");
  expect(prompt).toContain("[Check: how many unused vacation hours carry over]");
  // Only the draft and the notes are sent, never the Help articles.
  expect(prompt).not.toContain("Ordering lab supplies");
  expect(filled.filledCount).toBe(2);
  expect(filled.body).toContain("carries over into the next calendar year, up to 40 hours.");
  expect(filled.body).toContain("is forfeited on January 1.");
  expect(filled.body).toContain("[Check: the date carried-over vacation must be used by]");
  expect(await groupNamed(t, TIME_OFF)).toMatchObject({
    state: "drafted",
    draft: { visitorId, body: filled.body },
  });
  expect(await groupNamed(t, TIME_OFF, "visitor-2")).toMatchObject({
    draft: { body: group.draft!.body },
  });
});

test("a placeholder stays empty when no IT team note states the fact", async () => {
  const t = await setupWithHistory();
  const group = await groupNamed(t, RDNA);
  const body =
    "Submit a registration to [Check: which committee approves rDNA work]. Allow [Check: how long review takes].";
  fakeModelReply({
    title: "Getting approval for recombinant DNA work",
    department: "Ops",
    system: "ServiceNow",
    contactTeam: "Workplace & EHS",
    body,
  });
  await t.action(api.draftArticles.draft, { visitorId, gapGroupId: group._id });

  // A guess with no note, a note that doesn't exist, or a number the note
  // doesn't state isn't used.
  fakeModelReply({
    fills: [
      { placeholder: 1, fact: "the Institutional Biosafety Committee", noteNumber: null },
      { placeholder: 2, fact: "4 weeks", noteNumber: 99 },
      { placeholder: 2, fact: "10 business days", noteNumber: 12 },
    ],
  });
  const filled = await t.action(api.draftArticles.fill, {
    visitorId,
    gapGroupId: group._id,
  });

  expect(filled).toMatchObject({ body, filledCount: 0 });
  await expect(
    t.mutation(api.draftArticles.approve, { visitorId, gapGroupId: group._id }),
  ).rejects.toThrow(/placeholder/);
});

test("a fact with a dollar amount is filled as written", async () => {
  const t = await setupWithHistory();
  const group = await groupNamed(t, "Maximum hotel rates by city");
  fakeModelReply({
    title: "Maximum hotel rates by city",
    department: "Finance",
    system: "Concur",
    contactTeam: "Procurement & AP",
    body: "Boston hotels are capped at [Check: the Boston nightly hotel cap] a night.",
  });
  await t.action(api.draftArticles.draft, { visitorId, gapGroupId: group._id });

  fakeModelReply({
    fills: [{ placeholder: 1, fact: "$325", noteNumber: 20 }],
  });
  const filled = await t.action(api.draftArticles.fill, {
    visitorId,
    gapGroupId: group._id,
  });

  expect(filled.body).toBe("Boston hotels are capped at $325 a night.");
});

test("Fill from IT notes makes no AI call without a pending draft or with no placeholders left", async () => {
  const t = await setupWithHistory();
  const fetch = fakeModelReply();

  const open = await groupNamed(t, RDNA);
  await expect(
    t.action(api.draftArticles.fill, { visitorId, gapGroupId: open._id }),
  ).rejects.toThrow(/no pending Draft article/);

  const timeOff = await groupNamed(t, TIME_OFF);
  const body = timeOff.draft!.body.replace(/\[Check:[^\]]*\]/g, "a date");
  await t.mutation(api.draftArticles.save, {
    visitorId,
    gapGroupId: timeOff._id,
    title: timeOff.draft!.title,
    body,
  });
  expect(
    await t.action(api.draftArticles.fill, { visitorId, gapGroupId: timeOff._id }),
  ).toMatchObject({ body });
  expect(fetch).not.toHaveBeenCalled();
});
