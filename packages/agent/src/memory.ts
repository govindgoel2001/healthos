import { db, agentMemory } from "@meteor/db";
import type { AgentMemory, ProposedMemory } from "@meteor/shared";
import { eq } from "drizzle-orm";

/** Memory proposal gate — keeps the agent from turning memory into a notes app. */
export const MEMORY_CONFIDENCE_THRESHOLD = 0.7;
export const MEMORY_MIN_DATA_POINTS = 14;
export const MEMORY_MAX_PER_DAY = 2;

function toMemory(row: typeof agentMemory.$inferSelect): AgentMemory {
  return {
    id: row.id,
    fact: row.fact,
    confidence: row.confidence,
    source: row.source,
    status: row.status,
    confirmedAt: row.confirmedAt,
    dismissedAt: row.dismissedAt,
    createdAt: row.createdAt,
  };
}

/** Confirmed memories — these become priors in the daily system prompt. */
export async function loadConfirmedMemories(): Promise<AgentMemory[]> {
  const rows = await db
    .select()
    .from(agentMemory)
    .where(eq(agentMemory.status, "confirmed"));
  return rows.map(toMemory);
}

/** Dismissed memories — injected as "do not propose these again". */
export async function loadDismissedMemories(): Promise<AgentMemory[]> {
  const rows = await db
    .select()
    .from(agentMemory)
    .where(eq(agentMemory.status, "dismissed"));
  return rows.map(toMemory);
}

/**
 * Persists agent-proposed memories as `pending` rows, after applying the
 * proposal gate: derived claims need confidence above threshold, and no more
 * than MEMORY_MAX_PER_DAY are accepted per run.
 */
export async function persistProposedMemories(
  proposals: ProposedMemory[],
): Promise<AgentMemory[]> {
  const accepted = proposals
    .filter(
      (p) => p.source === "user" || p.confidence >= MEMORY_CONFIDENCE_THRESHOLD,
    )
    .slice(0, MEMORY_MAX_PER_DAY);

  if (accepted.length === 0) return [];

  const rows = await db
    .insert(agentMemory)
    .values(
      accepted.map((p) => ({
        fact: p.fact,
        confidence: p.confidence,
        source: p.source,
        status: "pending" as const,
      })),
    )
    .returning();
  return rows.map(toMemory);
}
