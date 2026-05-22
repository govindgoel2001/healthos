import { Bot } from "grammy";
import { answerQuestion } from "@meteor/agent";
import { config, todayIso } from "./config.js";
import { runDailyJob } from "./daily.js";

/** Builds the grammY bot: morning brief commands + reply handler. */
export function createBot(): Bot {
  const bot = new Bot(config.botToken);

  /** Guard: only the configured chat may talk to the bot. */
  const isOwner = (chatId: number | undefined) =>
    chatId !== undefined && String(chatId) === config.chatId;

  bot.command("start", async (ctx) => {
    if (!isOwner(ctx.chat?.id)) return;
    await ctx.reply("Hermes is online. Reply any time to ask about your data.");
  });

  // Manual trigger for the full morning job.
  bot.command("brief", async (ctx) => {
    if (!isOwner(ctx.chat?.id)) return;
    await ctx.reply("Running today's reasoning…");
    try {
      await runDailyJob(bot, todayIso());
    } catch (err) {
      console.error("[bot] /brief failed", err);
      await ctx.reply("Brief failed — check the agent logs.");
    }
  });

  // Any other text is a question for the agent.
  bot.on("message:text", async (ctx) => {
    if (!isOwner(ctx.chat?.id)) return;
    if (ctx.message.text.startsWith("/")) return;
    await ctx.replyWithChatAction("typing");
    try {
      const answer = await answerQuestion(ctx.message.text);
      await ctx.reply(answer);
    } catch (err) {
      console.error("[bot] answer failed", err);
      await ctx.reply("Couldn't reach the agent just now.");
    }
  });

  bot.catch((err) => console.error("[bot] error", err));
  return bot;
}
