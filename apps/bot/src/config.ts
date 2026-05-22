function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`missing required env var: ${name}`);
  return v;
}

export const config = {
  botToken: required("TELEGRAM_BOT_TOKEN"),
  /** The single chat the bot talks to. All other chats are ignored. */
  chatId: required("TELEGRAM_CHAT_ID"),
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? "http://localhost:3000",
  timezone: process.env.TZ ?? "UTC",
  /** Cron expression for the morning job. Default 06:30 daily. */
  morningCron: process.env.MORNING_CRON ?? "30 6 * * *",
};

/** Local YYYY-MM-DD, honouring the configured timezone. */
export function todayIso(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: config.timezone });
}
