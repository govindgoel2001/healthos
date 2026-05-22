import { getAllMemories } from "@meteor/db";
import { MemoryRow, type Memory } from "../../components/MemoryRow";

export const dynamic = "force-dynamic";

export default async function MemoryPage() {
  const rows = await getAllMemories();
  const memories: Memory[] = rows.map((r) => ({
    id: r.id,
    fact: r.fact,
    confidence: r.confidence,
    source: r.source,
    status: r.status,
  }));

  const pending = memories.filter((m) => m.status === "pending");
  const confirmed = memories.filter((m) => m.status === "confirmed");
  const dismissed = memories.filter((m) => m.status === "dismissed");

  return (
    <div className="space-y-8">
      <Section title={`pending · ${pending.length}`} memories={pending} empty="Nothing waiting on you." />
      <Section title={`confirmed · ${confirmed.length}`} memories={confirmed} empty="No confirmed memories yet." />
      {dismissed.length > 0 && (
        <Section title={`dismissed · ${dismissed.length}`} memories={dismissed} empty="" />
      )}
    </div>
  );
}

function Section({
  title,
  memories,
  empty,
}: {
  title: string;
  memories: Memory[];
  empty: string;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm lowercase tracking-wide text-muted">{title}</h2>
      {memories.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        memories.map((m) => <MemoryRow key={m.id} memory={m} />)
      )}
    </section>
  );
}
