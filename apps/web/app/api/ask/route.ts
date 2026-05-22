import { NextResponse } from "next/server";
import { answerQuestion } from "@meteor/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    if (typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }
    const answer = await answerQuestion(question.trim());
    return NextResponse.json({ answer });
  } catch (err) {
    console.error("[api/ask]", err);
    return NextResponse.json({ error: "agent unavailable" }, { status: 500 });
  }
}
