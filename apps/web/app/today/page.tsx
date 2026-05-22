import { getPlan, getRecentSnapshots, getSnapshot } from "@meteor/db";
import { composeBrief, type BriefMetrics } from "@meteor/shared";
import { ReadinessRing } from "../../components/ReadinessRing";
import { StatCard } from "../../components/StatCard";
import { PlanCard } from "../../components/PlanCard";
import { TelegramPreview } from "../../components/TelegramPreview";
import { AskInput } from "../../components/AskInput";
import { isoDaysAgo, sleepLabel, todayIso } from "../../lib/format";

export const dynamic = "force-dynamic";

function delta(a: number | null, b: number | null): number | null {
  if (a === null || b === null) return null;
  return a - b;
}
function pctDelta(a: number | null, b: number | null): number | null {
  if (a === null || b === null || b === 0) return null;
  return Math.round(((a - b) / b) * 100);
}

export default async function TodayPage() {
  const date = todayIso();
  const [today, yesterday, plan, history] = await Promise.all([
    getSnapshot(date),
    getSnapshot(isoDaysAgo(1)),
    getPlan(date),
    getRecentSnapshots(14),
  ]);

  if (!today) {
    return (
      <p className="text-muted">
        No snapshot for {date} yet. The agent writes one each morning, or run{" "}
        <span className="num text-ink">pnpm reason</span>.
      </p>
    );
  }

  // Sparkline series, oldest → newest.
  const series = [...history].reverse();
  // Drop null days before plotting — Number(null) is 0 and would distort the line.
  const pick = (k: keyof (typeof series)[number]) =>
    series
      .map((s) => s[k])
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));

  const briefMetrics = (s: typeof today): BriefMetrics => ({
    readiness: s.readiness,
    hrv: s.hrv,
    rhr: s.rhr,
    sleepMinutes: s.sleepMinutes,
  });
  const briefText = composeBrief({
    date,
    today: briefMetrics(today),
    prev: yesterday ? briefMetrics(yesterday) : null,
    planText: plan?.planText ?? "",
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <ReadinessRing
          readiness={today.readiness}
          delta={delta(today.readiness, yesterday?.readiness ?? null)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="hrv"
          value={today.hrv === null ? "--" : `${today.hrv}ms`}
          delta={pctDelta(today.hrv, yesterday?.hrv ?? null)}
          asPercent
          history={pick("hrv")}
        />
        <StatCard
          label="rhr"
          value={today.rhr === null ? "--" : String(today.rhr)}
          delta={delta(today.rhr, yesterday?.rhr ?? null)}
          history={pick("rhr")}
        />
        <StatCard
          label="sleep"
          value={sleepLabel(today.sleepMinutes)}
          delta={delta(today.sleepMinutes, yesterday?.sleepMinutes ?? null)}
          history={pick("sleepMinutes")}
        />
        <StatCard
          label="body battery"
          value={today.bodyBattery === null ? "--" : String(today.bodyBattery)}
          delta={delta(today.bodyBattery, yesterday?.bodyBattery ?? null)}
          history={pick("bodyBattery")}
        />
      </div>

      <PlanCard
        plan={plan?.planText ?? ""}
        reasoning={(plan?.reasoningChain as string[]) ?? []}
      />

      <TelegramPreview
        text={briefText}
        deliveredAt={plan?.deliveredToTelegramAt ?? null}
      />

      <AskInput />
    </div>
  );
}
