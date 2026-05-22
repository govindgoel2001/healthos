/** Manual one-shot: run the full morning job now. `pnpm --filter @meteor/bot brief`. */
import { createBot } from "./bot.js";
import { runDailyJob } from "./daily.js";
import { todayIso } from "./config.js";

async function main() {
  const date = process.argv[2] ?? todayIso();
  const bot = createBot();
  await runDailyJob(bot, date);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
