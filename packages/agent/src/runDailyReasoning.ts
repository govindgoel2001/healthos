import { db, dailySnapshots, plans } from "@meteor/db";
import { GarminProvider, enumerateDates } from "@meteor/mcp-client";
import type { AgentMemory, IsoDate, ReasoningResult } from "@meteor/shared";
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

    const [today, last7, last30, last90, trainingLoad, confirmed, dismissed] =
      await Promise.all([
        garmin.getDailyMetrics(date),
        garmin.getMetricsRange(shiftDate(date, -6), date),
        garmin.getMetricsRange(shiftDate(date, -29), date),
        garmin.getMetricsRange(shiftDate(date, -89), date),
        garmin.getTrainingLoad(date),
        loadConfirmedMemories(),
        loadDismissedMemories(),
      ]);

    const ctx: PromptContext = {
      date,
      today,
      last7,
      last30,
      last90,
      trainingLoad,
      confirmed,
      dismissed,
    };

    const result = await reasonWithClaude(ctx);

    await persistSnapshot(date, today, result);
    await persistPlan(date, result);
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
