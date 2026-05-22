import Anthropic from "@anthropic-ai/sdk";
import type { ReasoningResult } from "@meteor/shared";
import {
  buildSystemPrompt,
  buildUserMessage,
  SUBMIT_REASONING_TOOL,
  type PromptContext,
} from "./prompt.js";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/** Runs one Claude reasoning turn and returns the structured result. */
export async function reasonWithClaude(ctx: PromptContext): Promise<ReasoningResult> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: buildSystemPrompt(ctx),
    tools: [SUBMIT_REASONING_TOOL],
    tool_choice: { type: "tool", name: SUBMIT_REASONING_TOOL.name },
    messages: [{ role: "user", content: buildUserMessage(ctx) }],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return a submit_reasoning tool call");
  }

  const input = toolUse.input as Partial<ReasoningResult>;
  return {
    readiness: input.readiness ?? ctx.today.readiness,
    plan: input.plan ?? "",
    reasoning: input.reasoning ?? [],
    newMemories: input.newMemories ?? [],
  };
}
