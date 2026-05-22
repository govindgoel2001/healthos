/**
 * Phase 1 checkpoint: invoke runDailyReasoning manually and print the JSON.
 *
 *   pnpm reason -- 2026-05-22
 *
 * Pass --wait to exercise the freshness gate (polls Garmin until synced).
 */
import { runDailyReasoning } from "./runDailyReasoning.js";

async function main() {
  const args = process.argv.slice(2);
  const date = args.find((a: string) => /^\d{4}-\d{2}-\d{2}$/.test(a)) ??
    new Date().toISOString().slice(0, 10);
  const waitForFresh = args.includes("--wait");

  console.error(`running daily reasoning for ${date}…`);
  const result = await runDailyReasoning(date, { waitForFresh });
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
