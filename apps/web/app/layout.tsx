import type { Metadata } from "next";
import { getRecentSnapshots } from "@meteor/db";
import { MOON } from "@meteor/shared";
import { Nav } from "../components/Nav";
import { StatusPulse } from "../components/StatusPulse";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meteor Health",
  description: "A personal HealthOS.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [latest] = await getRecentSnapshots(1).catch(() => []);

  return (
    <html lang="en">
      <body className="font-mono">
        <div className="mx-auto max-w-3xl px-5 py-6">
          <header className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg text-moon">{MOON}</span>
              <span className="text-sm tracking-wide text-ink">
                meteor health
              </span>
            </div>
            <StatusPulse syncedAt={latest?.createdAt ?? null} />
          </header>
          <div className="mb-8">
            <Nav />
          </div>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
