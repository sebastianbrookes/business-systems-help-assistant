import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { GAP_REASON_LABELS } from "./gapReasons";
import { visitorId } from "./visitorId";

export function ItTeamPanel() {
  const groups = useQuery(api.gapGroups.list, { visitorId });
  const [openId, setOpenId] = useState<Id<"gapGroups"> | null>(null);

  return (
    <section className="panel">
      <h2>IT team</h2>
      <p className="muted">Gap groups: questions the Help articles didn't answer.</p>
      {groups?.length === 0 && <p className="muted">No Gaps yet.</p>}
      <ul className="groups">
        {groups?.map((g) => (
          <li key={g._id} className="group">
            <button
              className="group-toggle"
              aria-expanded={openId === g._id}
              onClick={() => setOpenId(openId === g._id ? null : g._id)}
            >
              <span>{g.title}</span>
              <span className="count">
                {g.questionCount} {g.questionCount === 1 ? "question" : "questions"}
              </span>
            </button>
            {openId === g._id && <GroupQuestions gapGroupId={g._id} />}
          </li>
        ))}
      </ul>
    </section>
  );
}

function GroupQuestions({ gapGroupId }: { gapGroupId: Id<"gapGroups"> }) {
  const group = useQuery(api.gapGroups.get, { visitorId, gapGroupId });
  return (
    <ul className="group-questions">
      {group?.questions.map((q) => (
        <li key={q._id}>
          {q.text}
          {q.gapReason && <span className="reason">{GAP_REASON_LABELS[q.gapReason]}</span>}
          {q.answer && <p className="given-answer">Answer given: {q.answer}</p>}
        </li>
      ))}
    </ul>
  );
}
