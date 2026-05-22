"use client";

import { useState } from "react";

/** Today's plan, with the reasoning chain revealed on "why →". */
export function PlanCard({
  plan,
  reasoning,
}: {
  plan: string;
  reasoning: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-line bg-card p-5">
      <p className="text-lg text-ink">{plan || "No plan set yet."}</p>
      {reasoning.length > 0 && (
        <>
          <button
            onClick={() => setOpen((v) => !v)}
            className="mt-3 text-sm text-muted hover:text-ink"
          >
            {open ? "hide why" : "why →"}
          </button>
          {open && (
            <ol className="mt-3 space-y-2 border-t border-line pt-3">
              {reasoning.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-muted">
                  <span className="num text-moon">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}
