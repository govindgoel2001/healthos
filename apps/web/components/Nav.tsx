"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/today", label: "today" },
  { href: "/trends", label: "trends" },
  { href: "/workouts", label: "workouts" },
  { href: "/memory", label: "memory" },
  { href: "/review", label: "review" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1">
      {LINKS.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              active
                ? "bg-cardhi text-ink"
                : "text-muted hover:text-ink hover:bg-card"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
