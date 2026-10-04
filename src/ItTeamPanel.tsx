import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../convex/_generated/api";
import type { Doc, Id } from "../convex/_generated/dataModel";
import { placeholdersIn } from "../convex/placeholders";
import { Dashboard } from "./Dashboard";
import { daysAgo } from "./daysAgo";
import { errorMessage } from "./errorMessage";
import { GAP_REASON_LABELS } from "./gapReasons";
import { visitorId } from "./visitorId";

const STATE_LABELS = { open: "Open", drafted: "Drafted", resolved: "Resolved" } as const;

type GroupSummary = FunctionReturnType<typeof api.gapGroups.list>[number];

export function ItTeamPanel({ flashingGroupIds }: { flashingGroupIds: Set<Id<"gapGroups">> }) {
  const [tab, setTab] = useState<"groups" | "dashboard">("groups");
  // A new Gap brings the Gap groups tab back, so its group's flash is seen.
  useEffect(() => {
    if (flashingGroupIds.size) setTab("groups");
  }, [flashingGroupIds]);

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
      <div role="tabpanel">{tab === "groups" ? <GapGroups flashingGroupIds={flashingGroupIds} /> : <Dashboard />}</div>
    </section>
  );
}

function GapGroups({ flashingGroupIds }: { flashingGroupIds: Set<Id<"gapGroups">> }) {
  const groups = useQuery(api.gapGroups.list, { visitorId });
  const [openId, setOpenId] = useState<Id<"gapGroups"> | null>(null);

  return (
    <>
      <p className="muted">Questions the Help articles didn't answer.</p>
      {groups?.length === 0 && <p className="muted">No Gaps yet.</p>}
      <ul className="groups">
        {groups?.map((g) => (
          <GroupItem
            key={g._id}
            group={g}
            flashing={flashingGroupIds.has(g._id)}
            expanded={openId === g._id}
            onToggle={(expand) => setOpenId(expand ? g._id : null)}
          />
        ))}
      </ul>
    </>
  );
}

function GroupItem({
  group: g,
  flashing,
  expanded,
  onToggle,
}: {
  group: GroupSummary;
  flashing: boolean;
  expanded: boolean;
  onToggle: (expand: boolean) => void;
}) {
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (flashing) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [flashing]);

  return (
    <li ref={ref} className={flashing ? "group flash" : "group"}>
      <button className="group-toggle" aria-expanded={expanded} onClick={() => onToggle(!expanded)}>
        <span>{g.title}</span>
        <span className="count">
          <span className={`state ${g.state}`}>{STATE_LABELS[g.state]}</span>
          {g.questionCount} {g.questionCount === 1 ? "question" : "questions"}
          {g.includesYours && <strong className="yours"> · incl. yours</strong>}
        </span>
      </button>
      {g.draftHint && !expanded && (
        <button className="draft-hint" onClick={() => onToggle(true)}>
          Next: draft the missing article →
        </button>
      )}
      {expanded && <GroupDetail gapGroupId={g._id} />}
    </li>
  );
}

function GroupDetail({ gapGroupId }: { gapGroupId: Id<"gapGroups"> }) {
  const group = useQuery(api.gapGroups.get, { visitorId, gapGroupId });
  if (!group) return null;
  return (
    <div className="group-detail">
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
      {group.revisesArticle && (
        <p className="muted revises">Revises: {group.revisesArticle.title}</p>
      )}
      {group.state === "open" && <DraftButton gapGroupId={gapGroupId} />}
      {group.state === "drafted" && group.draft && (
        <DraftEditor gapGroupId={gapGroupId} draft={group.draft} />
      )}
      {group.state === "resolved" && group.draft && (
        <div className="draft">
          <p className="approved">
            Approved {group.approvedAt !== null && daysAgo(group.approvedAt)}. Employees now get answers
            from this article.
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
        <textarea
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
