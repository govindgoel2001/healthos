import { deltaLabel } from "../lib/format";
import { Sparkline } from "./Sparkline";

export function StatCard({
  label,
  value,
  delta,
  asPercent = false,
  history = [],
}: {
  label: string;
  value: string;
  delta: number | null;
  asPercent?: boolean;
  history?: number[];
}) {
  const d = deltaLabel(delta, asPercent);
  const tone =
    d.tone === "good" ? "text-good" : d.tone === "bad" ? "text-bad" : "text-muted";

  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <div className="text-xs lowercase tracking-wide text-muted">{label}</div>
      <div className="mt-2 flex items-end justify-between">
        <div className="flex items-baseline gap-2">
          <span className="num text-2xl text-ink">{value}</span>
          {d.text && <span className={`num text-sm ${tone}`}>{d.text}</span>}
        </div>
        <Sparkline values={history} />
      </div>
    </div>
  );
}
