import type { DataFreshness, IsoDate } from "@meteor/shared";
import type { HealthProvider } from "@meteor/mcp-client";

const POLL_INTERVAL_MIN = Number(process.env.FRESHNESS_POLL_INTERVAL_MIN ?? 10);
const MAX_WAIT_MIN = Number(process.env.FRESHNESS_MAX_WAIT_MIN ?? 120);

export interface FreshnessOutcome extends DataFreshness {
  /** True when the wait window expired before data became fresh. */
  timedOut: boolean;
  /** Minutes spent waiting. */
  waitedMinutes: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * The freshness gate. Garmin Connect lags the watch→phone→cloud sync, so the
 * daily job calls this before reasoning: it polls until last night's data has
 * landed, or until the wait window expires.
 *
 * `onWait` fires once per poll so callers can log or surface "waiting for sync".
 */
export async function waitForFreshData(
  provider: HealthProvider,
  date: IsoDate,
  onWait?: (waitedMinutes: number) => void,
): Promise<FreshnessOutcome> {
  let waited = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const freshness = await provider.getDataFreshness(date);
    if (freshness.isFresh) {
      return { ...freshness, timedOut: false, waitedMinutes: waited };
    }
    if (waited >= MAX_WAIT_MIN) {
      return { ...freshness, timedOut: true, waitedMinutes: waited };
    }
    onWait?.(waited);
    await sleep(POLL_INTERVAL_MIN * 60_000);
    waited += POLL_INTERVAL_MIN;
  }
}
