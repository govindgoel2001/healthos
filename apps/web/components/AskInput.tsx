"use client";

import { useState } from "react";

/** Ask-anything input — posts to /api/ask and shows the agent's reply inline. */
export function AskInput() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setAnswer(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setAnswer(res.ok ? data.answer : (data.error ?? "Something went wrong."));
    } catch {
      setAnswer("Couldn't reach the agent.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <div className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="ask anything about your data…"
          className="num flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
        />
        <button
          onClick={submit}
          disabled={loading}
          className="rounded-md bg-cardhi px-3 py-1 text-sm text-ink disabled:opacity-50"
        >
          {loading ? "…" : "ask"}
        </button>
      </div>
      {answer && (
        <p className="mt-3 border-t border-line pt-3 text-sm text-muted">
          {answer}
        </p>
      )}
    </div>
  );
}
