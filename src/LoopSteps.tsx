import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { visitorId } from "./visitorId";

const STEPS = [
  "Ask something the Help articles don't cover",
  "Open its Gap group",
  "Draft the missing article",
  "Approve it",
];

/**
 * The demo's loop as steps, ticked off as the Visitor does them. A later step
 * ticks off the ones before it, so a Visitor who skips ahead isn't sent back.
 */
export function LoopSteps({ openedYours }: { openedYours: boolean }) {
  const questions = useQuery(api.questions.list, { visitorId });
  const groups = useQuery(api.gapGroups.list, { visitorId });
  const reached = [
    !!questions?.some((q) => q.gapGroupId),
    openedYours,
    !!groups?.some((g) => g.ownDraft),
    !!groups?.some((g) => g.ownDraft && g.state === "resolved"),
  ];
  const doneCount = reached.lastIndexOf(true) + 1;

  return (
    <nav className="steps" aria-label="Try the demo">
      <ol>
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={i < doneCount ? "done" : undefined}
            aria-current={i === doneCount ? "step" : undefined}
          >
            <span className="step-mark" aria-hidden>
              {i < doneCount ? "✓" : i + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>
      {doneCount === STEPS.length && (
        <p className="steps-done">Done. Employees who ask about this now get an answer from your article.</p>
      )}
    </nav>
  );
}
