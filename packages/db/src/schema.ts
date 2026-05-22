import {
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/** One row per day — the agent's normalised view of Garmin metrics. */
export const dailySnapshots = pgTable("daily_snapshots", {
  date: date("date").primaryKey(),
  readiness: integer("readiness"),
  bodyBattery: integer("body_battery"),
  hrv: integer("hrv"),
  rhr: integer("rhr"),
  sleepMinutes: integer("sleep_minutes"),
  sleepScore: integer("sleep_score"),
  strain: real("strain"),
  steps: integer("steps"),
  rawJson: jsonb("raw_json"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const memorySource = pgEnum("memory_source", ["derived", "user"]);
export const memoryStatus = pgEnum("memory_status", [
  "pending",
  "confirmed",
  "dismissed",
]);

/** The agent's growing set of claims about the user. Confirmed rows become priors. */
export const agentMemory = pgTable("agent_memory", {
  id: uuid("id").primaryKey().defaultRandom(),
  fact: text("fact").notNull(),
  confidence: real("confidence").notNull(),
  source: memorySource("source").notNull(),
  status: memoryStatus("status").notNull().default("pending"),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** One reasoning output per day. */
export const plans = pgTable("plans", {
  date: date("date").primaryKey(),
  planText: text("plan_text").notNull(),
  reasoningChain: jsonb("reasoning_chain").notNull(),
  deliveredToTelegramAt: timestamp("delivered_to_telegram_at", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const chatRole = pgEnum("chat_role", ["user", "assistant"]);

/** Backs the dashboard ask-anything input and Telegram reply threads. */
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  role: chatRole("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type DailySnapshotRow = typeof dailySnapshots.$inferSelect;
export type AgentMemoryRow = typeof agentMemory.$inferSelect;
export type PlanRow = typeof plans.$inferSelect;
export type ChatMessageRow = typeof chatMessages.$inferSelect;
