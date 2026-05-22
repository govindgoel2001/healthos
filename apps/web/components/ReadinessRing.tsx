"use client";

import { motion } from "framer-motion";

/** The breathing readiness ring — the one animated element in Meteor Health. */
export function ReadinessRing({
  readiness,
  delta,
}: {
  readiness: number | null;
  delta: number | null;
}) {
  const size = 184;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = readiness === null ? 0 : Math.max(0, Math.min(100, readiness)) / 100;

  const tone =
    readiness === null
      ? "#6b6b73"
      : readiness >= 66
        ? "#7fd1a0"
        : readiness >= 40
          ? "#e0b878"
          : "#e08c8c";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <motion.svg
        width={size}
        height={size}
        animate={{ opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#26262c"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </motion.svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num text-5xl text-ink">
          {readiness === null ? "--" : readiness}
        </span>
        <span className="mt-1 text-xs lowercase tracking-wide text-muted">
          readiness
          {delta !== null && delta !== 0 && (
            <span className={delta > 0 ? "text-good" : "text-bad"}>
              {" "}
              {delta > 0 ? "↑" : "↓"}
              {Math.abs(delta)}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
