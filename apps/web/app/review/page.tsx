import { getRecentActivities, getRecentSnapshots } from "@meteor/db";
import type { DailySnapshotRow } from "@meteor/db";
import { deltaLabel } from "../../lib/format";

export const dynamic = "force-dynamic";

function avg(rows: DailySnapshotRow[], key: keyof DailySnapshotRow): number | null {
  const nums = rows
    .map((r) => Number(r[key]))
    .filter((n) => Number.isFinite(n));
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export default async function ReviewPage() {
  const [snapshots, activities] = await Promise.all([
    getRecentSnapshots(14),
    getRecentActivities(40),
  ]);

  const thisWeek = snapshots.slice(0, 7);
  const lastWeek = snapshots.slice(7, 14);

  if (thisWeek.length === 0) {
    return <p className="text-muted">Not enough history for a review yet.</p>;
  }

  const metrics = [
    { key: "readiness" as const, label: "readiness" },
    { key: "hrv" as const, label: "hrv" },
    { key: "rhr" as const, label: "rhr" },
    { key: "sleepMinutes" as const, label: "sleep (min)" },
  ];

  const weekDates = new Set(thisWeek.map((s) => s.date));
  const workoutsThisWeek = activities.filter((a) => weekDates.has(a.date));

  return (
    <div className="space-y-6">
      <h1 className="text-sm lowercase tracking-wide text-muted">
        weekly review · {thisWeek[thisWeek.length - 1]?.date} → {thisWeek[0]?.date}
      </h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((m) => {
          const cur = avg(thisWeek, m.key);
          const prev = avg(lastWeek, m.key);
          const d =
            cur !== null && prev !== null ? deltaLabel(cur - prev) : { text: "", tone: "flat" as const };
          return (
            <div key={m.key} className="rounded-xl border border-line bg-card p-4">
              <div className="text-xs lowercase text-muted">{m.label}</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="num text-xl text-ink">{cur ?? "--"}</span>
                {d.text && (
                  <span
                    className={`num text-xs ${
                      d.tone === "good" ? "text-good" : "text-bad"
                    }`}
                  >
                    {d.text}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-line bg-card p-4">
        <div className="text-xs lowercase text-muted">workouts this week</div>
        <div className="num mt-1 text-xl text-ink">{workoutsThisWeek.length}</div>
        <ul className="mt-3 space-y-1">
          {workoutsThisWeek.map((w) => (
            <li key={w.id} className="num text-sm text-muted">
              {w.date} · {w.name} · {w.durationMinutes}m
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
