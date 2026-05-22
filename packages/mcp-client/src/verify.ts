/**
 * Phase 1 verification: connect to garmin-mcp and list its tools (the Garmin
 * equivalent of "available record types"). Run with `pnpm verify:mcp`.
 */
import { GarminProvider } from "./garmin.js";

async function main() {
  const date = process.argv[2] ?? new Date().toISOString().slice(0, 10);
  console.log("connecting to garmin-mcp…");
  const garmin = await GarminProvider.connect();

  const tools = await garmin.listRecordTypes();
  console.log(`\n${tools.length} tools exposed by garmin-mcp:`);
  for (const t of tools.sort()) console.log(`  - ${t}`);

  console.log(`\nsample getDailyMetrics(${date}):`);
  const metrics = await garmin.getDailyMetrics(date);
  console.log(JSON.stringify({ ...metrics, raw: "[omitted]" }, null, 2));

  await garmin.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
