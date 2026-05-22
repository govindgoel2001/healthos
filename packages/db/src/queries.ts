import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "./index.js";
import {
  activities,
  agentMemory,
  chatMessages,
  dailySnapshots,
  plans,
  type ActivityRow,
  type AgentMemoryRow,
  type ChatMessageRow,
  type DailySnapshotRow,
  type PlanRow,
} from "./schema.js";

// --- snapshots ---

export function getSnapshot(date: string): Promise<DailySnapshotRow | undefined> {
  return db
    .select()
    .from(dailySnapshots)
    .where(eq(dailySnapshots.date, date))
    .limit(1)
    .then((r) => r[0]);
}

export function getRecentSnapshots(limit: number): Promise<DailySnapshotRow[]> {
  return db
    .select()
    .from(dailySnapshots)
    .orderBy(desc(dailySnapshots.date))
    .limit(limit);
}

export function getSnapshotsBetween(
  from: string,
  to: string,
): Promise<DailySnapshotRow[]> {
  return db
    .select()
    .from(dailySnapshots)
    .where(and(gte(dailySnapshots.date, from), lte(dailySnapshots.date, to)))
    .orderBy(dailySnapshots.date);
}

// --- plans ---

export function getPlan(date: string): Promise<PlanRow | undefined> {
  return db
    .select()
    .from(plans)
    .where(eq(plans.date, date))
    .limit(1)
    .then((r) => r[0]);
}

export function getLatestPlan(): Promise<PlanRow | undefined> {
  return db
    .select()
    .from(plans)
    .orderBy(desc(plans.date))
    .limit(1)
    .then((r) => r[0]);
}

export async function markPlanDelivered(date: string): Promise<void> {
  await db
    .update(plans)
    .set({ deliveredToTelegramAt: new Date() })
    .where(eq(plans.date, date));
}

// --- memory ---

export function getMemoriesByStatus(
  status: "pending" | "confirmed" | "dismissed",
): Promise<AgentMemoryRow[]> {
  return db
    .select()
    .from(agentMemory)
    .where(eq(agentMemory.status, status))
    .orderBy(desc(agentMemory.createdAt));
}

export function getAllMemories(): Promise<AgentMemoryRow[]> {
  return db.select().from(agentMemory).orderBy(desc(agentMemory.createdAt));
}

export async function confirmMemory(id: string): Promise<void> {
  await db
    .update(agentMemory)
    .set({ status: "confirmed", confirmedAt: new Date() })
    .where(eq(agentMemory.id, id));
}

export async function dismissMemory(id: string): Promise<void> {
  await db
    .update(agentMemory)
    .set({ status: "dismissed", dismissedAt: new Date() })
    .where(eq(agentMemory.id, id));
}

export async function updateMemoryFact(id: string, fact: string): Promise<void> {
  await db.update(agentMemory).set({ fact }).where(eq(agentMemory.id, id));
}

// --- activities ---

export function getRecentActivities(limit: number): Promise<ActivityRow[]> {
  return db
    .select()
    .from(activities)
    .orderBy(desc(activities.date))
    .limit(limit);
}

export async function upsertActivities(
  rows: Omit<ActivityRow, "createdAt">[],
): Promise<void> {
  if (rows.length === 0) return;
  for (const row of rows) {
    await db
      .insert(activities)
      .values(row)
      .onConflictDoUpdate({ target: activities.id, set: row });
  }
}

// --- chat ---

export async function insertChatMessage(
  role: "user" | "assistant",
  content: string,
): Promise<void> {
  await db.insert(chatMessages).values({ role, content });
}

export async function getRecentChat(limit: number): Promise<ChatMessageRow[]> {
  const rows = await db
    .select()
    .from(chatMessages)
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
  return rows.reverse();
}
