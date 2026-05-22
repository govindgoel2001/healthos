import Anthropic from "@anthropic-ai/sdk";
import {
  getLatestPlan,
  getRecentChat,
  getRecentSnapshots,
  insertChatMessage,
} from "@meteor/db";
import { VOICE_RULES } from "@meteor/shared";
import { loadConfirmedMemories } from "./memory.js";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Answers a free-text question from the user — used by both the Telegram reply
 * handler and the dashboard ask-anything input. Pulls recent snapshots, the
 * latest plan and confirmed memories as grounding, then answers in voice.
 *
 * Both the question and the answer are persisted to `chat_messages`.
 */
export async function answerQuestion(question: string): Promise<string> {
  const [snapshots, plan, confirmed, history] = await Promise.all([
    getRecentSnapshots(14),
    getLatestPlan(),
    loadConfirmedMemories(),
    getRecentChat(10),
  ]);
  const memories = confirmed.map((m) => m.fact);

  const system = `You are Hermes, the agent inside Meteor Health. The user is
asking you a question. Answer it grounded in their data — never invent numbers.

${VOICE_RULES}

What you know about this person (confirmed):
${memories.length > 0 ? memories.map((m) => `- ${m}`).join("\n") : "- nothing yet"}

Today's plan: ${plan?.planText ?? "none set"}

Recent daily snapshots (newest first):
${JSON.stringify(snapshots, null, 2)}

Keep answers short. One or two sentences unless the question truly needs more.`;

  const priorTurns = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
  // The Anthropic API requires the first message to be from the user; drop
  // any leading assistant turns the recent-chat window may start on.
  while (priorTurns[0]?.role === "assistant") priorTurns.shift();

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system,
    messages: [...priorTurns, { role: "user", content: question }],
  });

  const answer = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  await insertChatMessage("user", question);
  await insertChatMessage("assistant", answer);
  return answer;
}
