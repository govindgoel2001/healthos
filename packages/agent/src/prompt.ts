import type { AgentMemory, DailyMetrics, TrainingLoad } from "@meteor/shared";
import { VOICE_RULES } from "@meteor/shared";
import {
  MEMORY_CONFIDENCE_THRESHOLD,
  MEMORY_MAX_PER_DAY,
  MEMORY_MIN_DATA_POINTS,
} from "./memory.js";

export interface PromptContext {
  date: string;
  today: DailyMetrics;
  last7: DailyMetrics[];
  last30: DailyMetrics[];
  last90: DailyMetrics[];
  trainingLoad: TrainingLoad;
  confirmed: AgentMemory[];
  dismissed: AgentMemory[];
}

/** Builds the Hermes system prompt — voice rules + confirmed memories as priors. */
export function buildSystemPrompt(ctx: PromptContext): string {
  const priors =
    ctx.confirmed.length > 0
      ? ctx.confirmed
          .map((m) => `- ${m.fact} (confidence ${m.confidence.toFixed(2)})`)
          .join("\n")
      : "- none yet";

  const doNotPropose =
    ctx.dismissed.length > 0
      ? ctx.dismissed.map((m) => `- ${m.fact}`).join("\n")
      : "- none";

  return `You are Hermes, the reasoning agent inside Meteor Health — a personal HealthOS
for one person. Each morning you read their Garmin data and decide one thing:
what today should be.

${VOICE_RULES}

What you know about this person (confirmed priors — treat as true):
${priors}

Patterns you have proposed before and they rejected (never propose these again):
${doNotPropose}

How to reason:
- Readiness is Garmin's native Training Readiness score. Do not recompute it;
  read it and explain it.
- Weigh today against the 7, 30 and 90-day context you are given.
- The plan is one or two short lines. "Today: light. Z2 only." is the shape.
- The reasoning chain is the honest "why" — 2 to 5 short steps, each one a
  sentence. This is shown when the user taps "why".

Proposing new memories:
- Propose a memory only when a pattern crosses confidence ${MEMORY_CONFIDENCE_THRESHOLD}
  over at least ${MEMORY_MIN_DATA_POINTS} data points.
- At most ${MEMORY_MAX_PER_DAY} new memories per day. Most days, propose none.
- A memory is a durable claim, e.g. "HRV dips every Tuesday after Monday heavy
  sessions". Not a restatement of today's numbers.

Return your answer by calling the submit_reasoning tool. Do not write prose
outside the tool call.`;
}

/** The forced-output tool — guarantees a structured ReasoningResult. */
export const SUBMIT_REASONING_TOOL = {
  name: "submit_reasoning",
  description: "Submit the daily reasoning result for Meteor Health.",
  input_schema: {
    type: "object" as const,
    properties: {
      readiness: {
        type: ["number", "null"],
        description: "Garmin Training Readiness for today, passed through.",
      },
      plan: {
        type: "string",
        description: 'One or two short lines, e.g. "Today: light. Z2 only."',
      },
      reasoning: {
        type: "array",
        items: { type: "string" },
        description: "2-5 short steps explaining the plan.",
      },
      newMemories: {
        type: "array",
        description: "Newly proposed memories. Usually empty.",
        items: {
          type: "object",
          properties: {
            fact: { type: "string" },
            confidence: { type: "number" },
            source: { type: "string", enum: ["derived", "user"] },
          },
          required: ["fact", "confidence", "source"],
        },
      },
    },
    required: ["readiness", "plan", "reasoning", "newMemories"],
  },
};

/** The user-turn payload: the metrics the agent reasons over. */
export function buildUserMessage(ctx: PromptContext): string {
  const compact = (m: DailyMetrics) => ({
    date: m.date,
    readiness: m.readiness,
    bodyBattery: m.bodyBattery,
    hrv: m.hrv,
    rhr: m.rhr,
    sleepMinutes: m.sleepMinutes,
    sleepScore: m.sleepScore,
    strain: m.strain,
    steps: m.steps,
  });

  return `Reasoning date: ${ctx.date}

Today:
${JSON.stringify(compact(ctx.today), null, 2)}

Training load (CTL/ATL/TSB):
${JSON.stringify(ctx.trainingLoad, null, 2)}

Last 7 days:
${JSON.stringify(ctx.last7.map(compact), null, 2)}

Last 30 days:
${JSON.stringify(ctx.last30.map(compact), null, 2)}

Last 90 days (oldest first, for trend only):
${JSON.stringify(ctx.last90.map(compact), null, 2)}`;
}
