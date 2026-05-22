/** Shows the morning brief exactly as it was (or will be) sent to Telegram. */
export function TelegramPreview({
  text,
  deliveredAt,
}: {
  text: string;
  deliveredAt: Date | null;
}) {
  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span>telegram brief</span>
        <span className="num">
          {deliveredAt
            ? `sent ${deliveredAt.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : "not sent yet"}
        </span>
      </div>
      <pre className="num whitespace-pre-wrap text-sm leading-relaxed text-ink">
        {text}
      </pre>
    </div>
  );
}
