import {
  db,
  dailySnapshots,
  getSnapshotsBetween,
  plans,
  upsertActivities,
  type DailySnapshotRow,
} from "@meteor/db";
import { GarminProvider } from "@meteor/mcp-client";
import type {
  AgentMemory,
  DailyMetrics,
  IsoDate,
  ReasoningResult,
} from "@meteor/shared";
import { reasonWithClaude } from "./anthropic.js";
import { waitForFreshData } from "./freshness.js";
import {
  loadConfirmedMemories,
  loadDismissedMemories,
  persistProposedMemories,
} from "./memory.js";
import type { PromptContext } from "./prompt.js";

export interface DailyReasoningOutput extends ReasoningResult {
  date: IsoDate;
  /** Memories actually written (after the proposal gate), as pending rows. */
  persistedMemories: AgentMemory[];
}

export interface RunOptions {
  /** When true, poll Garmin until last night's data syncs before reasoning. */
  waitForFresh?: boolean;
}

/** Shifts an ISO date by `days` (negative = earlier). */
function shiftDate(date: IsoDate, days: number): IsoDate {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Maps a persisted snapshot row back into the agent's DailyMetrics shape. */
function snapshotToMetrics(row: DailySnapshotRow): DailyMetrics {
  return {
    date: row.date,
    readiness: row.readiness,
    bodyBattery: row.bodyBattery,
    hrv: row.hrv,
    rhr: row.rhr,
    sleepMinutes: row.sleepMinutes,
    sleepScore: row.sleepScore,
    strain: row.strain,
    steps: row.steps,
    raw: row.rawJson,
  };
}

/**
 * The daily reasoning loop. Pulls Garmin context, loads agent memory, asks
 * Claude for today's plan, and persists snapshot + plan + proposed memories.
 */
export async function runDailyReasoning(
  date: IsoDate,
  opts: RunOptions = {},
): Promise<DailyReasoningOutput> {
  const garmin = await GarminProvider.connect();
  try {
    if (opts.waitForFresh) {
      const outcome = await waitForFreshData(garmin, date, (m) =>
        console.log(`waiting for Garmin sync… ${m}m elapsed`),
      );
      if (outcome.timedOut) {
        console.warn(
          `freshness window expired after ${outcome.waitedMinutes}m — reasoning on best-available data`,
        );
      }
    }

    // Only today is fetched live from Garmin. Historical days come from the
    // already-persisted daily_snapshots table — re-fetching 90 days from
    // Garmin every run would rate-limit the cloud API.
    const [today, history, trainingLoad, confirmed, dismissed] =
      await Promise.all([
        garmin.getDailyMetrics(date),
        getSnapshotsBetween(shiftDate(date, -90), shiftDate(date, -1)),
        garmin.getTrainingLoad(date),
        loadConfirmedMemories(),
        loadDismissedMemories(),
      ]);

    const series: DailyMetrics[] = [
      ...history.map(snapshotToMetrics),
      today,
    ];

    const ctx: PromptContext = {
      date,
      today,
      last7: series.slice(-7),
      last30: series.slice(-30),
      last90: series,
      trainingLoad,
      confirmed,
      dismissed,
    };

    const result = await reasonWithClaude(ctx);

    await persistSnapshot(date, today, result);
    await persistPlan(date, result);
    await persistActivities(garmin, date);
    const persistedMemories = await persistProposedMemories(result.newMemories);

    return { date, ...result, persistedMemories };
  } finally {
    await garmin.close();
  }
}

async function persistSnapshot(
  date: IsoDate,
  today: { hrv: number | null; rhr: number | null; bodyBattery: number | null;
    sleepMinutes: number | null; sleepScore: number | null; strain: number | null;
    steps: number | null; raw: unknown },
  result: ReasoningResult,
): Promise<void> {
  const values = {
    date,
    readiness: result.readiness,
    bodyBattery: today.bodyBattery,
    hrv: today.hrv,
    rhr: today.rhr,
    sleepMinutes: today.sleepMinutes,
    sleepScore: today.sleepScore,
    strain: today.strain,
    steps: today.steps,
    rawJson: today.raw as object,
  };
  await db
    .insert(dailySnapshots)
    .values(values)
    .onConflictDoUpdate({ target: dailySnapshots.date, set: values });
}

/** Pulls the last 3 days of workouts from Garmin and upserts them. */
async function persistActivities(
  garmin: GarminProvider,
  date: IsoDate,
): Promise<void> {
  const activities = await garmin.getActivities(shiftDate(date, -2), date);
  await upsertActivities(
    activities.map((a) => ({
      id: a.id,
      date: a.date,
      type: a.type,
      name: a.name,
      durationMinutes: a.durationMinutes,
      distanceMeters: a.distanceMeters,
      averageHr: a.averageHr,
      rawJson: a as object,
    })),
  );
}

async function persistPlan(date: IsoDate, result: ReasoningResult): Promise<void> {
  const values = {
    date,
    planText: result.plan,
    reasoningChain: result.reasoning,
  };
  await db
    .insert(plans)
    .values(values)
    .onConflictDoUpdate({
      target: plans.date,
      set: { planText: values.planText, reasoningChain: values.reasoningChain },
    });
}
