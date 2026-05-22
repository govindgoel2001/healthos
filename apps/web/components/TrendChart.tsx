"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface TrendPoint {
  date: string;
  readiness: number | null;
  hrv: number | null;
  rhr: number | null;
  sleepMinutes: number | null;
}

const RANGES = [30, 90, 365] as const;
const METRICS = [
  { key: "readiness", label: "readiness" },
  { key: "hrv", label: "hrv" },
  { key: "rhr", label: "rhr" },
  { key: "sleepMinutes", label: "sleep" },
] as const;

type MetricKey = (typeof METRICS)[number]["key"];

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const [range, setRange] = useState<number>(90);
  const [metric, setMetric] = useState<MetricKey>("readiness");

  const sliced = data.slice(-range);

  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`rounded-md px-2.5 py-1 text-xs ${
                metric === m.key ? "bg-cardhi text-ink" : "text-muted hover:text-ink"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`num rounded-md px-2.5 py-1 text-xs ${
                range === r ? "bg-cardhi text-ink" : "text-muted hover:text-ink"
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={sliced} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="#26262c" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#6b6b73", fontSize: 10 }}
            tickFormatter={(d: string) => d.slice(5)}
            minTickGap={32}
          />
          <YAxis tick={{ fill: "#6b6b73", fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              background: "#1c1c20",
              border: "1px solid #26262c",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#6b6b73" }}
          />
          <Line
            type="monotone"
            dataKey={metric}
            stroke="#cdd6f4"
            strokeWidth={1.8}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
