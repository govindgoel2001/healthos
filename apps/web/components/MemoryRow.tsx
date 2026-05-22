"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface Memory {
  id: string;
  fact: string;
  confidence: number;
  source: "derived" | "user";
  status: "pending" | "confirmed" | "dismissed";
}

export function MemoryRow({ memory }: { memory: Memory }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(memory.fact);
  const [busy, setBusy] = useState(false);

  async function act(action: string, fact?: string) {
    setBusy(true);
    try {
      await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: memory.id, action, fact }),
      });
      router.refresh();
    } finally {
      setBusy(false);
      setEditing(false);
    }
  }

  const pending = memory.status === "pending";

  return (
    <div
      className="rounded-xl border border-line bg-card p-4"
      style={pending ? { animation: "softpulse 3.5s ease-in-out infinite" } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        {editing ? (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="num flex-1 bg-transparent text-sm text-ink outline-none"
            autoFocus
          />
        ) : (
          <p className="flex-1 text-sm text-ink">{memory.fact}</p>
        )}
        <span className="num text-xs text-muted">
          {memory.confidence.toFixed(2)}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs">
        <span className="text-muted">{memory.source}</span>
        <span className="flex-1" />
        {editing ? (
          <button
            disabled={busy}
            onClick={() => act("edit", draft)}
            className="text-ink hover:text-moon"
          >
            save
          </button>
        ) : (
          <button onClick={() => setEditing(true)} className="text-muted hover:text-ink">
            edit
          </button>
        )}
        {memory.status !== "confirmed" && (
          <button
            disabled={busy}
            onClick={() => act("confirm")}
            className="text-good hover:opacity-80"
          >
            ✓ confirm
          </button>
        )}
        {memory.status !== "dismissed" && (
          <button
            disabled={busy}
            onClick={() => act("dismiss")}
            className="text-bad hover:opacity-80"
          >
            ✕ dismiss
          </button>
        )}
      </div>
    </div>
  );
}
