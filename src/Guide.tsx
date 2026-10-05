import { useQuery } from "convex/react";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { api } from "../convex/_generated/api";
import { placeholdersIn } from "../convex/placeholders";
import { STEP_COUNT, guideStep, onScreenTarget, type GuideInput, type GuideStep, type GuideView } from "./guideStep";
import { visitorId } from "./visitorId";

const SKIPPED_KEY = "northwake-help:guide-skipped";

/** Forgets a skip, for Start over. */
export const forgetGuideSkip = () => localStorage.removeItem(SKIPPED_KEY);

// What's on screen now, reported by the components that show it. None of it is saved.
type Session = GuideInput["session"] & Pick<GuideView, "itTeamTab">;
const INITIAL_SESSION: Session = { openGroupId: null, drafting: false, editor: null, itTeamTab: "groups" };
let session = INITIAL_SESSION;
const listeners = new Set<() => void>();

function updateSession(patch: Partial<Session>) {
  session = { ...session, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Tells the Guide what a component shows now. It's reset when the component unmounts. */
export function useReportToGuide(report: Partial<Session>) {
  const key = JSON.stringify(report);
  useEffect(() => {
    updateSession(report);
    const keys = Object.keys(report) as (keyof Session)[];
    return () => updateSession(Object.fromEntries(keys.map((k) => [k, INITIAL_SESSION[k]])));
  }, [key]);
}

/** The Guide's current step, and whether the Visitor skipped it in this browser. */
export function useGuide(view: Omit<GuideView, "itTeamTab">) {
  const [hidden, setHidden] = useState(() => localStorage.getItem(SKIPPED_KEY) !== null);
  const current = useSyncExternalStore(subscribe, () => session);
  const questions = useQuery(api.questions.list, { visitorId });
  const groups = useQuery(api.gapGroups.list, { visitorId });
  const own = groups && (groups.find((g) => g.ownDraft && g.state === "resolved") ?? groups.find((g) => g.ownDraft));
  const detail = useQuery(api.gapGroups.get, own ? { visitorId, gapGroupId: own._id } : "skip");

  function hide() {
    localStorage.setItem(SKIPPED_KEY, "1");
    setHidden(true);
  }
  function show() {
    forgetGuideSkip();
    setHidden(false);
  }

  if (hidden || !questions || !groups || (own && !detail?.draft)) return { step: null, hidden, hide, show };
  const draft = detail?.draft;
  const step = guideStep({
    questions,
    groups,
    ownDraft:
      own && draft
        ? {
            gapGroupId: own._id,
            placeholderCount: placeholdersIn(`${draft.title}\n${draft.body}`).length,
            articleId: draft.articleId,
            approvedAt: detail.approvedAt,
          }
        : null,
    session: current,
  });
  const target = step.target && onScreenTarget(step.target, { ...view, itTeamTab: current.itTeamTab });
  return { step: { ...step, target }, hidden, hide, show };
}

/**
 * The current step's callout, anchored to its target with CSS anchor
 * positioning. It hides while the target isn't on screen.
 */
export function Guide({ step, onHide }: { step: GuideStep; onHide: () => void }) {
  const target = useTargetElement(step.target);

  // Bring the target into view when a step starts, only if it's out of sight.
  const scrolledFor = useRef<string>(undefined);
  const key = `${step.step}:${step.target}`;
  useEffect(() => {
    if (!target || scrolledFor.current === key) return;
    scrolledFor.current = key;
    target.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [target, key]);

  // The target's ring and anchor. React doesn't manage this attribute, so it's safe to set here.
  useEffect(() => {
    if (!target) return;
    target.dataset.guideActive = "";
    return () => {
      delete target.dataset.guideActive;
    };
  }, [target]);

  return target && <Callout step={step} onHide={onHide} />;
}

function Callout({ step, onHide }: { step: GuideStep; onHide: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  // A manual popover sits in the top layer, so no pane clips it, and it never blocks the page.
  useLayoutEffect(() => ref.current?.showPopover(), []);

  return (
    <div ref={ref} className="guide" popover="manual" role="status">
      <span className="guide-arrow" aria-hidden />
      <p>{step.text}</p>
      <div className="guide-actions">
        <span className="guide-count">
          {step.step} of {STEP_COUNT}
        </span>
        <button className="guide-skip" onClick={onHide}>
          Skip guide
        </button>
        {step.finished && <button onClick={onHide}>Close</button>}
      </div>
    </div>
  );
}

/** The visible element marked with the target's data-guide attribute, as it comes and goes. */
function useTargetElement(target: string | null) {
  const [element, setElement] = useState<HTMLElement | null>(null);
  // A layout effect, so a step's new target is found before the screen updates.
  useLayoutEffect(() => {
    if (!target) return setElement(null);
    const find = () => {
      const found = document.querySelector<HTMLElement>(`[data-guide="${CSS.escape(target)}"]`);
      setElement(found?.checkVisibility() ? found : null);
    };
    find();
    const observer = new MutationObserver(find);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
    return () => observer.disconnect();
  }, [target]);
  // Until the effect runs, the element found for the last target is still in state.
  return element?.dataset.guide === target ? element : null;
}
