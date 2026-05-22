/**
 * The "last sync" status pulse. `syncedAt` is the time the most recent daily
 * snapshot was written — the freshest the dashboard's data can be.
 */
export function StatusPulse({ syncedAt }: { syncedAt: Date | null }) {
  const stale =
    syncedAt === null || Date.now() - syncedAt.getTime() > 36 * 3600_000;
  const label = syncedAt
    ? syncedAt.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "never";

  return (
    <div className="flex items-center gap-2 text-xs text-muted">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{
          background: stale ? "#e08c8c" : "#7fd1a0",
          animation: stale ? undefined : "softpulse 3s ease-in-out infinite",
        }}
      />
      <span className="num">last sync {label}</span>
    </div>
  );
}
