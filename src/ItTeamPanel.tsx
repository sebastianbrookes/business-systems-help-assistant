import { useAction, useMutation, useQuery } from "convex/react";
import { type TextareaHTMLAttributes, useEffect, useRef, useState } from "react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../convex/_generated/api";
import type { Doc, Id } from "../convex/_generated/dataModel";
import { PLACEHOLDER, placeholdersIn } from "../convex/placeholders";
import { Dashboard } from "./Dashboard";
import { daysAgo } from "./daysAgo";
import { errorMessage } from "./errorMessage";
import { GAP_REASON_LABELS } from "./gapReasons";
import { visitorId } from "./visitorId";

const STATE_LABELS = { open: "Open", drafted: "Drafted", resolved: "Resolved" } as const;

const questionCount = (n: number) => `${n} ${n === 1 ? "question" : "questions"}`;

type GroupSummary = FunctionReturnType<typeof api.gapGroups.list>[number];

export function ItTeamPanel({
  flashingGroupIds,
  onOpenYours,
}: {
  flashingGroupIds: Set<Id<"gapGroups">>;
  onOpenYours: () => void;
}) {
  const [tab, setTab] = useState<"groups" | "dashboard">("groups");
  const [openId, setOpenId] = useState<Id<"gapGroups"> | null>(null);
  // The group to focus when Back returns to the list, so it's found after drafting or approving moved it.
  const [backFrom, setBackFrom] = useState<Id<"gapGroups"> | null>(null);
  // Focus it only once. Parent effects run after the list's, so the group is focused by now.
  useEffect(() => {
    if (backFrom) setBackFrom(null);
  }, [backFrom]);
  // A new Gap brings back the Gap groups list, so its group's flash is seen.
  useEffect(() => {
    if (!flashingGroupIds.size) return;
    setTab("groups");
    setOpenId(null);
  }, [flashingGroupIds]);

  function onOpen(g: GroupSummary) {
    setBackFrom(null);
    setOpenId(g._id);
    if (g.includesYours) onOpenYours();
  }

  return (
    <section className="panel">
      <h2>IT team</h2>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === "groups"} onClick={() => setTab("groups")}>
          Gap groups
        </button>
        <button role="tab" aria-selected={tab === "dashboard"} onClick={() => setTab("dashboard")}>
          Dashboard
        </button>
      </div>
      <div role="tabpanel">
        {tab === "dashboard" ? (
          <Dashboard />
        ) : openId ? (
          <GroupDetail
            gapGroupId={openId}
            onBack={() => {
              setBackFrom(openId);
              setOpenId(null);
            }}
          />
        ) : (
          <GapGroups flashingGroupIds={flashingGroupIds} focusId={backFrom} onOpen={onOpen} />
        )}
      </div>
    </section>
  );
}

function GapGroups({
  flashingGroupIds,
  focusId,
  onOpen,
}: {
  flashingGroupIds: Set<Id<"gapGroups">>;
  focusId: Id<"gapGroups"> | null;
  onOpen: (g: GroupSummary) => void;
}) {
  const groups = useQuery(api.gapGroups.list, { visitorId });
  if (!groups) return null;

  return (
    <>
      <p className="muted">Questions the Help articles didn't answer.</p>
      {groups.length === 0 && <p className="muted">No Gaps yet.</p>}
      {/* The list comes sorted by state, so the sections follow its order. */}
      {[...new Set(groups.map((g) => g.state))].map((state) => {
        const inSection = groups.filter((g) => g.state === state);
        return (
          <section key={state} className="group-section" aria-labelledby={`section-${state}`}>
            <h3 id={`section-${state}`}>
              {STATE_LABELS[state]} <span className="section-count">{inSection.length}</span>
            </h3>
            <ul className="groups">
              {inSection.map((g) => (
                <GroupItem
                  key={g._id}
                  group={g}
                  flashing={flashingGroupIds.has(g._id)}
                  focused={focusId === g._id}
                  onOpen={() => onOpen(g)}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}

function GroupItem({
  group: g,
  flashing,
  focused,
  onOpen,
}: {
  group: GroupSummary;
  flashing: boolean;
  focused: boolean;
  onOpen: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  // Only on mount: Back remounts the list.
  useEffect(() => {
    if (focused) ref.current?.focus();
  }, []);
  useEffect(() => {
    if (flashing) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [flashing]);

  return (
    <li className={flashing ? "group flash" : "group"}>
      <button ref={ref} className="group-open" onClick={onOpen}>
        <span>{g.title}</span>
        <span className="count">
          {questionCount(g.questionCount)}
          {g.includesYours && <strong className="yours"> · incl. yours</strong>}
        </span>
      </button>
    </li>
  );
}

function GroupDetail({ gapGroupId, onBack }: { gapGroupId: Id<"gapGroups">; onBack: () => void }) {
  const group = useQuery(api.gapGroups.get, { visitorId, gapGroupId });
  // Focusing Back brings the detail into view, wherever the list was scrolled.
  const backRef = useRef<HTMLButtonElement>(null);
  useEffect(() => backRef.current?.focus(), []);

  return (
    <div className="group-detail">
      <button ref={backRef} className="back" onClick={onBack}>
        ← All Gap groups
      </button>
      {group && (
        <>
          <h3>{group.title}</h3>
          <p className="muted">
            <span className={`state ${group.state}`}>{STATE_LABELS[group.state]}</span>
            {questionCount(group.questions.length)}
          </p>
          <ul className="group-questions">
            {group.questions.map((q) => (
              <li key={q._id}>
                {q.text}
                {q.gapReason && <span className="reason">{GAP_REASON_LABELS[q.gapReason]}</span>}
                <span className="when">{daysAgo(q.askedAt)}</span>
                {q.answer && <p className="given-answer">Answer given: {q.answer}</p>}
              </li>
            ))}
          </ul>
          {group.revisesArticle && <p className="muted revises">Revises: {group.revisesArticle.title}</p>}
          {group.state === "open" && <DraftButton gapGroupId={gapGroupId} />}
          {group.state === "drafted" && group.draft && <DraftEditor gapGroupId={gapGroupId} draft={group.draft} />}
          {group.state === "resolved" && group.draft && (
            <div className="draft">
              <p className="approved">
                Approved {group.approvedAt !== null && daysAgo(group.approvedAt)}. Employees now get answers from this
                article.
              </p>
              <h3>{group.draft.title}</h3>
              <p className="answer">{group.draft.body}</p>
              {group.answeredAfter.length > 0 && (
                <>
                  <h3>Answered from it since</h3>
                  <ul className="group-questions">
                    {group.answeredAfter.map((q) => (
                      <li key={q._id}>
                        {q.text}
                        <span className="when">{daysAgo(q.askedAt)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DraftButton({ gapGroupId }: { gapGroupId: Id<"gapGroups"> }) {
  const draft = useAction(api.draftArticles.draft);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDraft() {
    setDrafting(true);
    setError(null);
    try {
      await draft({ visitorId, gapGroupId });
    } catch (e) {
      setError(errorMessage(e));
    }
    setDrafting(false);
  }

  return (
    <div className="draft-actions">
      <button disabled={drafting} onClick={onDraft}>
        {drafting ? "Drafting…" : "Draft article"}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

function DraftEditor({
  gapGroupId,
  draft,
}: {
  gapGroupId: Id<"gapGroups">;
  draft: Doc<"draftArticles">;
}) {
  const save = useMutation(api.draftArticles.save);
  const approve = useMutation(api.draftArticles.approve);
  const fill = useAction(api.draftArticles.fill);
  const [title, setTitle] = useState(draft.title);
  const [body, setBody] = useState(draft.body);
  const [approving, setApproving] = useState(false);
  const [filling, setFilling] = useState(false);
  const [fillResult, setFillResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const placeholders = placeholdersIn(`${title}\n${body}`);

  /** Saves the edits if they changed. Returns whether the draft is saved. */
  async function saveEdits() {
    if (title === draft.title && body === draft.body) return true;
    setError(null);
    try {
      await save({ visitorId, gapGroupId, title, body });
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    }
  }

  async function onFill() {
    setFilling(true);
    setFillResult(null);
    setError(null);
    if (await saveEdits()) {
      try {
        const filled = await fill({ visitorId, gapGroupId });
        setTitle(filled.title);
        setBody(filled.body);
        setFillResult(
          filled.filledCount === 0
            ? "The IT team notes don't state any of these facts."
            : `Filled ${filled.filledCount} from the IT team notes.`,
        );
      } catch (e) {
        setError(errorMessage(e));
      }
    }
    setFilling(false);
  }

  async function onApprove() {
    setApproving(true);
    if (await saveEdits()) {
      try {
        await approve({ visitorId, gapGroupId });
      } catch (e) {
        setError(errorMessage(e));
      }
    }
    setApproving(false);
  }

  return (
    <div className="draft">
      <label>
        Title
        <input value={title} readOnly={filling} onChange={(e) => setTitle(e.target.value)} onBlur={saveEdits} />
      </label>
      <label>
        Article
        <HighlightedTextarea
          value={body}
          rows={14}
          readOnly={filling}
          onChange={(e) => setBody(e.target.value)}
          onBlur={saveEdits}
        />
      </label>
      {placeholders.length > 0 ? (
        <div className="placeholders">
          Replace {placeholders.length === 1 ? "this placeholder" : `these ${placeholders.length} placeholders`} with the real fact before approving:
          <ul>
            {placeholders.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="muted">No placeholders left.</p>
      )}
      {fillResult && <p className="muted">{fillResult}</p>}
      <div className="draft-actions">
        {placeholders.length > 0 && (
          <button disabled={filling || approving} onClick={onFill}>
            {filling ? "Filling…" : "Fill from IT notes"}
          </button>
        )}
        <button disabled={filling || approving || placeholders.length > 0} onClick={onApprove}>
          {approving ? "Approving…" : "Approve"}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

// Splits text so placeholders land at the odd indexes.
const PLACEHOLDER_SPLIT = new RegExp(`(${PLACEHOLDER.source})`, "i");

/**
 * A textarea that highlights its [Check: …] placeholders. A textarea can't style
 * its own text, so a copy with the placeholders marked sits behind it. The copy
 * sets the height, so the textarea grows with its text and never scrolls apart.
 */
function HighlightedTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string }) {
  const parts = props.value.split(PLACEHOLDER_SPLIT);
  return (
    <div className="highlighted">
      <div className="highlights" aria-hidden>
        {parts.map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part))}
        {"\n"}
      </div>
      <textarea {...props} />
    </div>
  );
}
