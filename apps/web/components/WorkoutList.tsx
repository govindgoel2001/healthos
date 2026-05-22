"use client";

import { useState } from "react";

export interface Workout {
  id: string;
  date: string;
  type: string;
  name: string;
  durationMinutes: number;
  distanceMeters: number | null;
  averageHr: number | null;
}

function km(m: number | null): string {
  return m === null ? "--" : `${(m / 1000).toFixed(2)}km`;
}

function isHyrox(w: Workout): boolean {
  return /hyrox/i.test(w.name) || /hyrox/i.test(w.type);
}

export function WorkoutList({ workouts }: { workouts: Workout[] }) {
  const [selected, setSelected] = useState<Workout | null>(null);

  if (workouts.length === 0) {
    return <p className="text-muted">No workouts recorded yet.</p>;
  }

  return (
    <div className="space-y-2">
      {workouts.map((w) => (
        <button
          key={w.id}
          onClick={() => setSelected(w)}
          className="flex w-full items-center justify-between rounded-xl border border-line bg-card p-4 text-left hover:bg-cardhi"
        >
          <div>
            <div className="text-sm text-ink">
              {w.name}
              {isHyrox(w) && (
                <span className="ml-2 rounded bg-cardhi px-1.5 py-0.5 text-[10px] text-moon">
                  hyrox
                </span>
              )}
            </div>
            <div className="num text-xs text-muted">{w.date}</div>
          </div>
          <div className="num text-sm text-muted">
            {w.durationMinutes}m · {km(w.distanceMeters)}
          </div>
        </button>
      ))}

      {selected && (
        <div
          className="fixed inset-0 z-10 flex items-end justify-center bg-black/60 sm:items-center"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl border border-line bg-card p-6 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h2 className="text-ink">{selected.name}</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-muted hover:text-ink"
              >
                ✕
              </button>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="date" value={selected.date} />
              <Row label="type" value={selected.type} />
              <Row label="duration" value={`${selected.durationMinutes}m`} />
              <Row label="distance" value={km(selected.distanceMeters)} />
              <Row
                label="avg hr"
                value={selected.averageHr === null ? "--" : `${selected.averageHr}bpm`}
              />
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-line pb-1.5">
      <dt className="text-muted">{label}</dt>
      <dd className="num text-ink">{value}</dd>
    </div>
  );
}
