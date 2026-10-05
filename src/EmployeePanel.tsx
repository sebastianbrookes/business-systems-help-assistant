import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { errorMessage } from "./errorMessage";
import { visitorId } from "./visitorId";

// A Suggested question's answer is saved, so it waits about as long as a real answer takes.
const SUGGESTED_ANSWER_DELAY_MS = 2000;
// A new answer streams in a word at a time, like a chat reply.
const STREAM_WORD_MS = 30;

/** The Employee side. The Guide's prefill puts a question in the input to ask live. */
export function EmployeePanel({ prefill }: { prefill?: string }) {
  const questions = useQuery(api.questions.list, { visitorId });
  const suggested = useQuery(api.questions.suggested, {});
  const ask = useAction(api.questions.ask);
  const askSuggested = useMutation(api.questions.askSuggested);
  const didntHelp = useAction(api.questions.didntHelp);
  const [text, setText] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<Id<"questions"> | null>(null);
  // Fill in each prefill once, so it doesn't come back after the Visitor asks it.
  const prefilled = useRef<string>(undefined);
  useEffect(() => {
    if (!prefill || prefill === prefilled.current) return;
    prefilled.current = prefill;
    setText(prefill);
  }, [prefill]);

  // A new answer lands at the bottom of the list, so scroll it into view and flash it.
  const newestRef = useRef<HTMLLIElement>(null);
  const shownCount = useRef<number>(undefined);
  const [flashingId, setFlashingId] = useState<Id<"questions"> | null>(null);
  useEffect(() => {
    if (!questions) return;
    const isNew = shownCount.current !== undefined && questions.length > shownCount.current;
    shownCount.current = questions.length;
    if (!isNew) return;
    newestRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    setFlashingId(questions[questions.length - 1]._id);
  }, [questions]);
  useEffect(() => {
    if (!flashingId) return;
    const timer = setTimeout(() => setFlashingId(null), 2500);
    return () => clearTimeout(timer);
  }, [flashingId]);

  // Answers from before this page load show whole. Later ones stream until they're done.
  const loadedIds = useRef<Set<Id<"questions">>>(undefined);
  if (questions && !loadedIds.current) loadedIds.current = new Set(questions.map((q) => q._id));
  const [streamedIds, setStreamedIds] = useState<Set<Id<"questions">>>(new Set());
  const isStreaming = (id: Id<"questions">) => !loadedIds.current?.has(id) && !streamedIds.has(id);
  // Bring the sources into view once an answer is done.
  useEffect(() => {
    if (streamedIds.size) newestRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [streamedIds]);

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

  async function onSuggested(suggestedQuestionId: Id<"suggestedQuestions">) {
    setAsking(true);
    await new Promise((resolve) => setTimeout(resolve, SUGGESTED_ANSWER_DELAY_MS));
    await withErrorMessage(() => askSuggested({ visitorId, suggestedQuestionId }));
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

      <ul className="suggested">
        {suggested?.map((s) => (
          <li key={s._id}>
            <button
              disabled={asking}
              onClick={() => onSuggested(s._id)}
              data-guide={s.outcome === "gap" ? "suggested-gap" : undefined}
            >
              {s.text}
              <span className="hint">{s.hint}</span>
            </button>
          </li>
        ))}
      </ul>

      <ol className="questions">
        {questions?.map((q, i) => (
          <li
            key={q._id}
            ref={i === questions.length - 1 ? newestRef : undefined}
            className={q._id === flashingId ? "question flash" : "question"}
            data-guide={`answer:${q._id}`}
            aria-busy={isStreaming(q._id) || undefined}
          >
            <p className="asked">{q.text}</p>
            {q.outcome === "gap" && (
              <p className="sent">
                The Help articles don't fully cover this, so your question went to the IT team.
              </p>
            )}
            {isStreaming(q._id) ? (
              <StreamedAnswer
                text={q.answer}
                onGrow={() => newestRef.current?.scrollIntoView({ block: "nearest" })}
                onDone={() => setStreamedIds((ids) => new Set(ids).add(q._id))}
              />
            ) : (
              <>
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
              </>
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
          data-guide="employee-input"
        />
        <button disabled={asking || !text.trim()}>
          {asking ? "Thinking…" : "Ask"}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </main>
  );
}

/** A new answer, revealed a word at a time. Its sources show once it's done. */
function StreamedAnswer({ text, onGrow, onDone }: { text: string; onGrow: () => void; onDone: () => void }) {
  // Each word keeps the space or line break after it, so the text wraps as it will in full.
  const words = text.split(/(?<=\s)/);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (shown >= words.length) return onDone();
    onGrow();
    const timer = setTimeout(() => setShown(shown + 1), STREAM_WORD_MS);
    return () => clearTimeout(timer);
  }, [shown]);
  return <p className="answer">{words.slice(0, shown).join("")}</p>;
}
