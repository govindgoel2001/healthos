/**
 * Voice rules for Meteor Health. The agent writes in this voice everywhere:
 * Telegram, dashboard insights, memory entries, reasoning chains.
 *
 * `VOICE_RULES` is lifted verbatim into the agent system prompt.
 */
export const VOICE_RULES = `Voice rules — follow these exactly in everything you write:
- Never hedge. Write "Today: light. Z2 only." Not "I think you might want to consider…".
- Every number carries its delta. Write "42ms ↓12%", never a bare "42ms".
- Sentence case. No Title Case, no ALL CAPS.
- No marketing voice. No emojis except the moon glyph ☾.
- Speak only when you have something earned to say. Err heavily toward silence.`;

/** Direction arrows used in formatted metrics. */
export const ARROW_UP = "↑";
export const ARROW_DOWN = "↓";

export interface FormatMetricOptions {
  /** Unit suffix appended to the value, e.g. "ms". */
  unit?: string;
  /** When true, the delta is rendered as a percentage. */
  asPercent?: boolean;
  /** Decimal places for the delta. Default 0. */
  deltaPrecision?: number;
}

/**
 * Formats a metric so it always carries its delta — the one true way to
 * render a number anywhere in Meteor Health.
 *
 *   formatMetric(42, -12, { unit: "ms", asPercent: true }) -> "42ms ↓12%"
 *   formatMetric(58, 3)                                    -> "58 ↑3"
 *
 * A null/zero delta renders the value with no arrow.
 */
export function formatMetric(
  value: number,
  delta: number | null,
  opts: FormatMetricOptions = {},
): string {
  const { unit = "", asPercent = false, deltaPrecision = 0 } = opts;
  const base = `${value}${unit}`;
  if (delta === null || delta === 0 || Number.isNaN(delta)) return base;
  const arrow = delta > 0 ? ARROW_UP : ARROW_DOWN;
  const magnitude = Math.abs(delta).toFixed(deltaPrecision);
  const suffix = asPercent ? "%" : "";
  return `${base} ${arrow}${magnitude}${suffix}`;
}

/** Percentage change from `previous` to `current`, or null if not computable. */
export function percentDelta(
  current: number | null,
  previous: number | null,
): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Absolute change from `previous` to `current`, or null if not computable. */
export function absoluteDelta(
  current: number | null,
  previous: number | null,
): number | null {
  if (current === null || previous === null) return null;
  return current - previous;
}
