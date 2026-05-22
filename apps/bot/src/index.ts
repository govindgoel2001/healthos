import cron from "node-cron";
import { config } from "./config.js";
import { createBot } from "./bot.js";
import { runDailyJob } from "./daily.js";

/**
 * The bot worker: a long-lived process that runs the Telegram bot and the
 * 06:30 morning job on one schedule. This folds Phase 4's cron into the bot
 * container — one worker, one set of credentials.
 */
async function main() {
  const bot = createBot();

  cron.schedule(
    config.morningCron,
    () => {
      runDailyJob(bot).catch((err) => console.error("[cron] daily job failed", err));
    },
    { timezone: config.timezone },
  );
  console.log(`[bot] morning job scheduled: "${config.morningCron}" (${config.timezone})`);

  await bot.api.deleteWebhook().catch(() => {});
  console.log("[bot] starting long-poll…");
  await bot.start();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
