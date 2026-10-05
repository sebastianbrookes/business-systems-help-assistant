export const STEP_COUNT = 6;

/** Where a Guide callout points. Each target's element has a matching data-guide attribute. */
export type GuideTarget =
  | "suggested-gap"
  | `group:${string}`
  | "draft-button"
  | "fill-button"
  | "placeholders"
  | "approve-button"
  | "employee-input"
  | `answer:${string}`
  | "tab:employee"
  | "tab:itTeam"
  | "tab:groups";

/** What the Guide reads: the Visitor's data, plus what's on screen now, which isn't saved. */
export interface GuideInput {
  questions: {
    _id: string;
    _creationTime: number;
    text: string;
    outcome: "answered" | "gap" | "offTopic" | "paused";
    gapGroupId?: string;
    citedArticles: { _id: string }[];
  }[];
  groups: { _id: string; state: "open" | "drafted" | "resolved"; includesYours: boolean; ownDraft: boolean }[];
  /** The Visitor's furthest-along own draft: its placeholders and, once approved, its Help article. */
  ownDraft: { gapGroupId: string; placeholderCount: number; articleId?: string; approvedAt: number | null } | null;
  session: {
    openGroupId: string | null;
    drafting: boolean;
    /** The open draft editor's live placeholder count, and whether Fill from IT notes ran in it. */
    editor: { gapGroupId: string; placeholderCount: number; filled: boolean } | null;
  };
}

export interface GuideStep {
  step: number;
  target: GuideTarget | null;
  text: string;
  /** Step 6 fills the Employee input with the Visitor's Gap question, so it's asked live. */
  prefill?: string;
  /** The loop is done, so the callout offers Close. */
  finished?: true;
}

/**
 * The Guide's current step, from the Visitor's data. A later step ticks off the
 * ones before it, so a Visitor who skips ahead isn't sent back.
 */
export function guideStep({ questions, groups, ownDraft, session }: GuideInput): GuideStep {
  const openGroup = groups.find((g) => g._id === session.openGroupId);
  // The open editor's count is live, so typing the last fact counts before it's saved.
  const editor = session.editor?.gapGroupId === ownDraft?.gapGroupId ? session.editor : null;
  const placeholderCount = editor?.placeholderCount ?? ownDraft?.placeholderCount;
  // A Gap can name the article as related, so only an answered question counts.
  const answeredFromYours = questions.find(
    (q) => q.outcome === "answered" && q.citedArticles.some((a) => a._id === ownDraft?.articleId),
  );
  const reached = [
    questions.some((q) => q.gapGroupId),
    !!openGroup?.includesYours,
    !!ownDraft,
    placeholderCount === 0,
    !!ownDraft?.articleId,
    !!answeredFromYours,
  ];
  const step = Math.min(reached.lastIndexOf(true) + 2, STEP_COUNT);
  // Steps 4 and 5 happen in the Visitor's draft, so with it closed they point at its group.
  const inDraft = (target: GuideTarget): GuideTarget =>
    session.openGroupId === ownDraft?.gapGroupId ? target : `group:${ownDraft?.gapGroupId}`;

  switch (step) {
    case 1: {
      const last = questions.at(-1);
      return {
        step,
        target: "suggested-gap",
        text:
          last?.outcome === "answered" || last?.outcome === "offTopic"
            ? "That one had an answer. Try this one."
            : "You're an Employee. Ask this one. The Help articles don't cover it.",
      };
    }
    case 2: {
      const yours = groups.find((g) => g.state === "open" && g.includesYours);
      return {
        step,
        target: yours ? `group:${yours._id}` : null,
        text: "You're the IT team now. Your question joined others asking the same thing. Open the group.",
      };
    }
    case 3:
      return {
        step,
        target: "draft-button",
        text: session.drafting ? "Writing the draft…" : "Have the AI write the missing article from these questions.",
      };
    case 4:
      return editor?.filled
        ? {
            step,
            target: inDraft("placeholders"),
            text: "The notes don't have this one. Type the fact into the article.",
          }
        : {
            step,
            target: inDraft("fill-button"),
            text: "The AI marked facts it couldn't source. Fill them from the IT team's notes.",
          };
    case 5:
      return {
        step,
        target: inDraft("approve-button"),
        text: "Every fact is filled in. Approve it so Employees get answers from it.",
      };
  }
  if (answeredFromYours) {
    return {
      step,
      target: `answer:${answeredFromYours._id}`,
      text: "Answered from your article. That's the loop.",
      finished: true,
    };
  }
  const last = questions.at(-1);
  if (last?.outcome === "gap" && last._creationTime > ownDraft!.approvedAt!) {
    return { step, target: `answer:${last._id}`, text: "It missed this time. Try rewording." };
  }
  const gaps = questions.filter((q) => q.gapGroupId);
  const inYourGroup = gaps.filter((q) => q.gapGroupId === ownDraft!.gapGroupId);
  return {
    step,
    target: "employee-input",
    text: "Ask your question again as an Employee.",
    prefill: (inYourGroup.at(-1) ?? gaps.at(-1))?.text,
  };
}

/** What's on screen: the phone tab and the IT team panel's tab. */
export interface GuideView {
  isPhone: boolean;
  phoneTab: "employee" | "itTeam";
  itTeamTab: "groups" | "dashboard";
}

const EMPLOYEE_TARGETS = /^(suggested-gap|employee-input|answer:)/;

/**
 * Where to point on screen. A target on the other phone tab points at that tab,
 * and one behind the Dashboard points at the Gap groups tab.
 */
export function onScreenTarget(target: GuideTarget, { isPhone, phoneTab, itTeamTab }: GuideView): GuideTarget {
  const pane = EMPLOYEE_TARGETS.test(target) ? "employee" : "itTeam";
  if (isPhone && phoneTab !== pane) return `tab:${pane}`;
  if (pane === "itTeam" && itTeamTab === "dashboard") return "tab:groups";
  return target;
}
