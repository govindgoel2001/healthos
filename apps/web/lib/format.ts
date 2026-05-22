/** ISO date N days before today, in the given timezone. */
export function isoDaysAgo(days: number): string {
  const tz = process.env.TZ ?? "UTC";
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toLocaleDateString("en-CA", { timeZone: tz });
}

export function todayIso(): string {
  return isoDaysAgo(0);
}

/** "↑3" / "↓12%" / "" — the delta fragment for a metric. */
export function deltaLabel(
  delta: number | null,
  asPercent = false,
): { text: string; tone: "good" | "bad" | "flat" } {
  if (delta === null || delta === 0 || Number.isNaN(delta)) {
    return { text: "", tone: "flat" };
  }
  const arrow = delta > 0 ? "↑" : "↓";
  return {
    text: `${arrow}${Math.abs(delta)}${asPercent ? "%" : ""}`,
    tone: delta > 0 ? "good" : "bad",
  };
}

/** Sleep minutes → "6h12". */
export function sleepLabel(minutes: number | null): string {
  if (minutes === null) return "--";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${String(m).padStart(2, "0")}`;
}
