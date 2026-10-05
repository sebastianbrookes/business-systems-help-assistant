import { describe, expect, test } from "vitest";
import { guideStep, onScreenTarget, type GuideInput } from "./guideStep";

const fresh: GuideInput = {
  questions: [],
  groups: [],
  ownDraft: null,
  session: { openGroupId: null, drafting: false, editor: null },
};

describe("step 1: ask a Gap question", () => {
  test("a first-time Visitor is pointed at the Gap Suggested question", () => {
    expect(guideStep(fresh)).toEqual({
      step: 1,
      target: "suggested-gap",
      text: "You're an Employee. Ask this one. The Help articles don't cover it.",
    });
  });

  test("after a question that had an answer, it asks for the Gap one instead", () => {
    const offTopic = question({ outcome: "offTopic" });
    expect(guideStep({ ...fresh, questions: [offTopic] })).toMatchObject({
      step: 1,
      target: "suggested-gap",
      text: "That one had an answer. Try this one.",
    });
  });
});

describe("step 2: open the Gap group", () => {
  test("a Gap points at the first Open group that includes it", () => {
    const groups = [
      group({ _id: "drafted", state: "drafted", includesYours: true }),
      group({ _id: "other" }),
      group({ _id: "yours", includesYours: true }),
    ];
    expect(guideStep({ ...fresh, questions: [gap("yours")], groups })).toEqual({
      step: 2,
      target: "group:yours",
      text: "You're the IT team now. Your question joined others asking the same thing. Open the group.",
    });
  });
});

describe("step 3: draft the article", () => {
  const atGroup = { ...fresh, questions: [gap("yours")], groups: [group({ _id: "yours", includesYours: true })] };
  const opened = { ...atGroup, session: { ...fresh.session, openGroupId: "yours" } };

  test("opening the group points at Draft article", () => {
    expect(guideStep(opened)).toEqual({
      step: 3,
      target: "draft-button",
      text: "Have the AI write the missing article from these questions.",
    });
  });

  test("while the draft is written, it says so", () => {
    expect(guideStep({ ...opened, session: { ...opened.session, drafting: true } })).toMatchObject({
      step: 3,
      text: "Writing the draft…",
    });
  });

  test("opening a group isn't saved, so a reload points at the group again", () => {
    const reloaded = { ...opened, session: fresh.session };
    expect(guideStep(reloaded)).toMatchObject({ step: 2, target: "group:yours" });
  });

  test("opening a group that doesn't include the Visitor's question doesn't count", () => {
    const otherOpen = { ...atGroup, session: { ...fresh.session, openGroupId: "other" } };
    expect(guideStep(otherOpen)).toMatchObject({ step: 2 });
  });
});

describe("steps 4 and 5: fill the placeholders and approve", () => {
  const drafted: GuideInput = {
    questions: [gap("yours")],
    groups: [group({ _id: "yours", state: "drafted", includesYours: true, ownDraft: true })],
    ownDraft: { gapGroupId: "yours", placeholderCount: 3, approvedAt: null },
    session: {
      openGroupId: "yours",
      drafting: false,
      editor: { gapGroupId: "yours", placeholderCount: 3, filled: false },
    },
  };
  const editing = (editor: Partial<NonNullable<GuideInput["session"]["editor"]>>): GuideInput => ({
    ...drafted,
    session: { ...drafted.session, editor: { ...drafted.session.editor!, ...editor } },
  });

  test("a draft with placeholders points at Fill from IT notes", () => {
    expect(guideStep(drafted)).toEqual({
      step: 4,
      target: "fill-button",
      text: "The AI marked facts it couldn't source. Fill them from the IT team's notes.",
    });
  });

  test("placeholders left after filling are pointed at to type in", () => {
    expect(guideStep(editing({ filled: true, placeholderCount: 1 }))).toEqual({
      step: 4,
      target: "placeholders",
      text: "The notes don't have this one. Type the fact into the article.",
    });
  });

  test("typing the last fact moves on to Approve, before the edit is saved", () => {
    expect(guideStep(editing({ placeholderCount: 0 }))).toEqual({
      step: 5,
      target: "approve-button",
      text: "Every fact is filled in. Approve it so Employees get answers from it.",
    });
  });

  test("a saved draft with no placeholders is ready to approve after a reload", () => {
    const reloaded = { ...drafted, ownDraft: { ...drafted.ownDraft!, placeholderCount: 0 }, session: fresh.session };
    expect(guideStep(reloaded)).toMatchObject({ step: 5, target: "group:yours" });
  });

  test("with the group closed, the step points at the group", () => {
    expect(guideStep({ ...drafted, session: fresh.session })).toMatchObject({ step: 4, target: "group:yours" });
  });

  test("drafting any group skips ahead, even without opening the Visitor's own", () => {
    const skipped: GuideInput = {
      ...fresh,
      groups: [group({ _id: "starting", state: "drafted", ownDraft: true })],
      ownDraft: { gapGroupId: "starting", placeholderCount: 2, approvedAt: null },
    };
    expect(guideStep(skipped)).toMatchObject({ step: 4, target: "group:starting" });
  });
});

describe("step 6: ask again as an Employee", () => {
  const yourGap = gap("yours");
  const approved: GuideInput = {
    questions: [question({ outcome: "offTopic" }), yourGap],
    groups: [group({ _id: "yours", state: "resolved", includesYours: true, ownDraft: true })],
    ownDraft: { gapGroupId: "yours", placeholderCount: 0, articleId: "article", approvedAt: yourGap._creationTime + 1 },
    session: fresh.session,
  };
  const askedAfter = (fields: Partial<GuideInput["questions"][number]>) => {
    const asked = question({ _creationTime: approved.ownDraft!.approvedAt! + 1, ...fields });
    return { asked, input: { ...approved, questions: [...approved.questions, asked] } };
  };

  test("approving points at the Employee input, filled with the Visitor's Gap question", () => {
    expect(guideStep(approved)).toEqual({
      step: 6,
      target: "employee-input",
      text: "Ask your question again as an Employee.",
      prefill: yourGap.text,
    });
  });

  test("an answer from the approved article finishes the loop", () => {
    const { asked, input } = askedAfter({ citedArticles: [{ _id: "article" }] });
    expect(guideStep(input)).toEqual({
      step: 6,
      target: `answer:${asked._id}`,
      text: "Answered from your article. That's the loop.",
      finished: true,
    });
  });

  test("a Gap after approval asks for a rewording", () => {
    const { asked, input } = askedAfter({ outcome: "gap", gapGroupId: "other" });
    expect(guideStep(input)).toEqual({
      step: 6,
      target: `answer:${asked._id}`,
      text: "It missed this time. Try rewording.",
    });
  });

  test("a Gap that names the approved article as related still asks for a rewording", () => {
    const { asked, input } = askedAfter({ outcome: "gap", gapGroupId: "new", citedArticles: [{ _id: "article" }] });
    expect(guideStep(input)).toMatchObject({ step: 6, target: `answer:${asked._id}`, text: "It missed this time. Try rewording." });
  });

  test("an answer from another article isn't the loop closing", () => {
    const { input } = askedAfter({ citedArticles: [{ _id: "other" }] });
    expect(guideStep(input)).toMatchObject({ step: 6, target: "employee-input" });
  });
});

describe("off the path", () => {
  const desktop = { isPhone: false, phoneTab: "employee", itTeamTab: "groups" } as const;

  test("on a desktop, the target is shown where it is", () => {
    expect(onScreenTarget("draft-button", desktop)).toBe("draft-button");
  });

  test("on a phone, a target on the other tab points at that tab", () => {
    expect(onScreenTarget("group:yours", { ...desktop, isPhone: true })).toBe("tab:itTeam");
    expect(onScreenTarget("answer:q1", { ...desktop, isPhone: true, phoneTab: "itTeam" })).toBe("tab:employee");
  });

  test("with the Dashboard open, an IT team target points at the Gap groups tab", () => {
    const dashboard = { ...desktop, itTeamTab: "dashboard" } as const;
    expect(onScreenTarget("approve-button", dashboard)).toBe("tab:groups");
    expect(onScreenTarget("employee-input", dashboard)).toBe("employee-input");
  });
});

let nextId = 0;

function question(fields: Partial<GuideInput["questions"][number]>): GuideInput["questions"][number] {
  nextId++;
  return { _id: `q${nextId}`, _creationTime: nextId, text: `Question ${nextId}`, outcome: "answered", citedArticles: [], ...fields };
}

const gap = (gapGroupId: string) => question({ outcome: "gap", gapGroupId });

function group(fields: Partial<GuideInput["groups"][number]>): GuideInput["groups"][number] {
  return { _id: "g", state: "open", includesYours: false, ownDraft: false, ...fields };
}
