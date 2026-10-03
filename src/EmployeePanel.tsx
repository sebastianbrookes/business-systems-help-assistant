import { useAction, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useState, type FormEvent } from "react";
import { api } from "../convex/_generated/api";
import { visitorId } from "./visitorId";

export function EmployeePanel() {
  const questions = useQuery(api.questions.list, { visitorId });
  const ask = useAction(api.questions.ask);
  const [text, setText] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setAsking(true);
    setError(null);
    try {
      await ask({ visitorId, text });
      setText("");
    } catch (e) {
      setError(
        e instanceof ConvexError ? String(e.data) : "Something went wrong. Try again.",
      );
    } finally {
      setAsking(false);
    }
  }

  return (
    <main className="panel">
      <h1>Northwake Help</h1>
      <p className="muted">Ask how to get something done in a business system.</p>

      <ol className="questions">
        {questions?.map((q) => (
          <li key={q._id} className="question">
            <p className="asked">{q.text}</p>
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
