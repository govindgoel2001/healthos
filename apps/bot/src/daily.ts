import type { Bot } from "grammy";
import { runDailyReasoning, waitForFreshData } from "@meteor/agent";
import { GarminProvider } from "@meteor/mcp-client";
import { MOON } from "@meteor/shared";
import { todayIso } from "./config.js";
import { sendMorningBrief, sendNudge } from "./brief.js";

/**
 * The morning job: freshness gate → reasoning → brief.
 *
 * Garmin Connect lags the watch→phone→cloud sync, so this polls until last
 * night's data has landed. If the window expires it nudges the user to open
 * Garmin Connect, then reasons on the best-available data anyway.
 */
export async function runDailyJob(bot: Bot, date = todayIso()): Promise<void> {
  console.log(`[daily] starting job for ${date}`);

  const garmin = await GarminProvider.connect();
  let timedOut = false;
  try {
    const outcome = await waitForFreshData(garmin, date, (m) =>
      console.log(`[daily] waiting for Garmin sync… ${m}m elapsed`),
    );
    timedOut = outcome.timedOut;
  } finally {
    await garmin.close();
  }

  if (timedOut) {
    await sendNudge(
      bot,
      `${MOON} last night's data hasn't synced yet. Open Garmin Connect to sync — the brief below uses what's available.`,
    );
  }

  await runDailyReasoning(date);
  await sendMorningBrief(bot, date);
  console.log(`[daily] job complete for ${date}`);
}
