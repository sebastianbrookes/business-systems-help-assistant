import { useAction, useQuery } from "convex/react";
import { useState, type FormEvent } from "react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { errorMessage } from "./errorMessage";
import { visitorId } from "./visitorId";

export function EmployeePanel() {
  const questions = useQuery(api.questions.list, { visitorId });
  const ask = useAction(api.questions.ask);
  const didntHelp = useAction(api.questions.didntHelp);
  const [text, setText] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<Id<"questions"> | null>(null);

  /** Runs `call`, showing any failure as the error message. Returns whether it worked. */
  async function withErrorMessage(call: () => Promise<unknown>) {
    setError(null);
    try {
      await call();
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setAsking(true);
    if (await withErrorMessage(() => ask({ visitorId, text }))) setText("");
    setAsking(false);
  }

  async function onDidntHelp(questionId: Id<"questions">) {
    setMarkingId(questionId);
    await withErrorMessage(() => didntHelp({ visitorId, questionId }));
    setMarkingId(null);
  }

  return (
    <main className="panel">
      <h1>Northwake Help</h1>
      <p className="muted">Ask how to get something done in a business system.</p>

      <ol className="questions">
        {questions?.map((q) => (
          <li key={q._id} className="question">
            <p className="asked">{q.text}</p>
            {q.outcome === "gap" && (
              <p className="sent">
                The Help articles don't fully cover this, so your question went to the IT team.
              </p>
            )}
            <p className="answer">{q.answer}</p>
            {q.citedArticles.length > 0 && (
              <ul className="sources">
                {q.citedArticles.map((a) => (
                  <li key={a._id}>
                    {q.outcome === "gap" ? "Related" : "From"} <strong>{a.title}</strong> · Contact {a.contactTeam}
                  </li>
                ))}
              </ul>
            )}
            {q.outcome === "gap" && q.citedArticles.length === 0 && (
              <ul className="sources">
                <li>Contact the IT Service Desk</li>
              </ul>
            )}
            {q.didntHelp && (
              <p className="sent">Thanks. We sent this answer to the IT team to review.</p>
            )}
            {q.outcome === "answered" && !q.didntHelp && (
              <button
                className="didnt-help"
                disabled={markingId !== null}
                onClick={() => onDidntHelp(q._id)}
              >
                {markingId === q._id ? "Sending…" : "Didn't help"}
              </button>
            )}
          </li>
        ))}
      </ol>

      <form onSubmit={onSubmit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="How do I…?"
          maxLength={500}
          disabled={asking}
        />
        <button disabled={asking || !text.trim()}>
          {asking ? "Thinking…" : "Ask"}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </main>
  );
}
