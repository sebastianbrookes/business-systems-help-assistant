import { expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import { setupWithHistory, useTestEnv } from "./test.helpers";

const visitorId = "visitor-1";

useTestEnv();

async function askGapSuggestion(t: Awaited<ReturnType<typeof setupWithHistory>>) {
  const suggested = await t.query(api.questions.suggested, {});
  const gap = suggested.find((s) => s.outcome === "gap")!;
  await t.mutation(api.questions.askSuggested, {
    visitorId,
    suggestedQuestionId: gap._id,
  });
}

test("reload gives a fresh copy of the starting data", async () => {
  const t = await setupWithHistory();
  const freshGroups = await t.query(api.gapGroups.list, { visitorId });
  const freshDashboard = await t.query(api.dashboard.get, { visitorId });
  await askGapSuggestion(t);
  expect(await t.query(api.questions.list, { visitorId })).toHaveLength(1);

  vi.stubEnv("ALLOW_SEED_RELOAD", "true");
  await t.mutation(internal.seed.reload);

  expect(await t.query(api.questions.list, { visitorId })).toEqual([]);
  const groups = await t.query(api.gapGroups.list, { visitorId });
  expect(groups.map(({ _id, ...g }) => g)).toEqual(
    freshGroups.map(({ _id, ...g }) => g),
  );
  expect(await t.query(api.dashboard.get, { visitorId })).toEqual(
    freshDashboard,
  );
});

test("reload refuses to run unless the deployment allows it", async () => {
  const t = await setupWithHistory();
  await askGapSuggestion(t);

  await expect(t.mutation(internal.seed.reload)).rejects.toThrow(
    "ALLOW_SEED_RELOAD",
  );
  expect(await t.query(api.questions.list, { visitorId })).toHaveLength(1);
});
