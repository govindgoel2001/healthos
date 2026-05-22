import { NextResponse } from "next/server";
import { confirmMemory, dismissMemory, updateMemoryFact } from "@meteor/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Memory actions from the /memory page: confirm, dismiss, or edit a fact. */
export async function POST(req: Request) {
  try {
    const { id, action, fact } = await req.json();
    if (typeof id !== "string" || typeof action !== "string") {
      return NextResponse.json({ error: "id and action required" }, { status: 400 });
    }
    switch (action) {
      case "confirm":
        await confirmMemory(id);
        break;
      case "dismiss":
        await dismissMemory(id);
        break;
      case "edit":
        if (typeof fact !== "string" || fact.trim().length === 0) {
          return NextResponse.json({ error: "fact required" }, { status: 400 });
        }
        await updateMemoryFact(id, fact.trim());
        break;
      default:
        return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/memory]", err);
    return NextResponse.json({ error: "memory update failed" }, { status: 500 });
  }
}
