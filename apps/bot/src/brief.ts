import type { Bot } from "grammy";
import { InlineKeyboard } from "grammy";
import {
  getPlan,
  getSnapshot,
  markPlanDelivered,
  type DailySnapshotRow,
} from "@meteor/db";
import { composeBrief, MOON, type BriefMetrics } from "@meteor/shared";
import { config } from "./config.js";

function yesterdayOf(date: string): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function toBriefMetrics(row: DailySnapshotRow | undefined): BriefMetrics | null {
  if (!row) return null;
  return {
    readiness: row.readiness,
    hrv: row.hrv,
    rhr: row.rhr,
    sleepMinutes: row.sleepMinutes,
  };
}

/** HTML-escape, since the brief is sent with HTML parse mode. */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Sends the morning brief for `date` to the configured chat. */
export async function sendMorningBrief(bot: Bot, date: string): Promise<void> {
  const [today, yesterday, plan] = await Promise.all([
    getSnapshot(date),
    getSnapshot(yesterdayOf(date)),
    getPlan(date),
  ]);

  if (!today) {
    await sendNudge(bot, `${MOON} no data for ${date} yet.`);
    return;
  }

  const body = composeBrief({
    date,
    today: toBriefMetrics(today)!,
    prev: toBriefMetrics(yesterday),
    planText: plan?.planText ?? "",
  });

  const keyboard = new InlineKeyboard().url(
    "Tap for why →",
    `${config.publicBaseUrl}/today`,
  );

  await bot.api.sendMessage(config.chatId, `<pre>${esc(body)}</pre>`, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });

  if (plan) await markPlanDelivered(date);
}

/** Sends a short contextual message — nudges, sync prompts, errors. */
export async function sendNudge(bot: Bot, text: string): Promise<void> {
  await bot.api.sendMessage(config.chatId, text);
}
