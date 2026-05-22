import { MOON } from "./glyph.js";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Renders "☾ Tue 21 May" for the brief header. */
export function briefDateHeader(date: Date): string {
  const wd = WEEKDAYS[date.getUTCDay()];
  const d = date.getUTCDate();
  const m = MONTHS[date.getUTCMonth()];
  return `${MOON} ${wd} ${d} ${m}`;
}

/** Renders sleep minutes as "6h12". */
export function formatSleep(minutes: number | null): string {
  if (minutes === null) return "--";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m.toString().padStart(2, "0")}`;
}

/** Renders a clock time as "06:42". */
export function formatClock(date: Date): string {
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}
