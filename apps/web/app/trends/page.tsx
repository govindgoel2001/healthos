import { getRecentSnapshots } from "@meteor/db";
import { TrendChart, type TrendPoint } from "../../components/TrendChart";

export const dynamic = "force-dynamic";

export default async function TrendsPage() {
  const rows = await getRecentSnapshots(365);
  const data: TrendPoint[] = [...rows].reverse().map((r) => ({
    date: r.date,
    readiness: r.readiness,
    hrv: r.hrv,
    rhr: r.rhr,
    sleepMinutes: r.sleepMinutes,
  }));

  if (data.length === 0) {
    return <p className="text-muted">No history yet.</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-sm lowercase tracking-wide text-muted">trends</h1>
      <TrendChart data={data} />
    </div>
  );
}
