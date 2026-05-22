import { briefDateHeader, formatSleep } from "./format.js";
import { absoluteDelta, formatMetric, percentDelta } from "./voice.js";

export interface BriefMetrics {
  readiness: number | null;
  hrv: number | null;
  rhr: number | null;
  sleepMinutes: number | null;
}

export interface BriefInput {
  /** ISO date the brief is for. */
  date: string;
  today: BriefMetrics;
  /** Yesterday's metrics, for deltas. */
  prev: BriefMetrics | null;
  planText: string;
}

/**
 * The single source of truth for the morning brief text. The Telegram bot
 * sends this; the dashboard previews the identical string.
 *
 *   ☾ Tue 21 May
 *
 *   Readiness 72 ↓8
 *   HRV 42ms ↓12%  RHR 54 ↑2
 *   Sleep 6h12 ↓1h04
 *
 *   Today: light. Z2 only.
 */
export function composeBrief({ date, today, prev, planText }: BriefInput): string {
  const header = briefDateHeader(new Date(date + "T12:00:00Z"));

  const readiness =
    today.readiness === null
      ? "Readiness --"
      : `Readiness ${formatMetric(
          today.readiness,
          absoluteDelta(today.readiness, prev?.readiness ?? null),
        )}`;

  const hrv =
    today.hrv === null
      ? "HRV --"
      : `HRV ${formatMetric(today.hrv, percentDelta(today.hrv, prev?.hrv ?? null), {
          unit: "ms",
          asPercent: true,
        })}`;

  const rhr =
    today.rhr === null
      ? "RHR --"
      : `RHR ${formatMetric(today.rhr, absoluteDelta(today.rhr, prev?.rhr ?? null))}`;

  const sleepDelta = absoluteDelta(today.sleepMinutes, prev?.sleepMinutes ?? null);
  const sleep =
    today.sleepMinutes === null
      ? "Sleep --"
      : `Sleep ${formatSleep(today.sleepMinutes)}${
          sleepDelta
            ? ` ${sleepDelta > 0 ? "↑" : "↓"}${formatSleep(Math.abs(sleepDelta))}`
            : ""
        }`;

  return [
    header,
    "",
    readiness,
    `${hrv}  ${rhr}`,
    sleep,
    "",
    planText || "Today: —",
  ].join("\n");
}
