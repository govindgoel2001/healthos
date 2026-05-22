# Meteor Health

A single-user personal HealthOS. The **Hermes** agent pulls Garmin data each
morning, reasons over it, sends a Telegram brief, and powers an ask-anything
dashboard.

> Data source: **Garmin Connect** via the [`Taxuspt/garmin_mcp`](https://github.com/Taxuspt/garmin_mcp)
> MCP server. Apple Watch support is deferred — `packages/mcp-client` is
> provider-abstracted so it can be added later.

## Layout

```
apps/web      Next.js 14 dashboard            (Phase 3)
apps/bot      grammY Telegram bot             (Phase 2)
packages/agent      Hermes — runDailyReasoning
packages/mcp-client Garmin MCP wrapper + provider interface
packages/db         Postgres schema (Drizzle)
packages/shared     Types, voice rules, formatMetric, ☾
infra         docker-compose, Caddy, cron
```

## Setup

```bash
pnpm install
cp .env.example .env          # fill in ANTHROPIC_API_KEY, Garmin, Telegram
```

### One-time Garmin auth

`garmin_mcp` needs OAuth tokens (MFA-safe, last ~6 months). Run the
interactive auth once and point the token volume at the result:

```bash
uvx --python 3.12 --from git+https://github.com/Taxuspt/garmin_mcp garmin-mcp-auth
# tokens are written to ~/.garminconnect — mount that into the agent container
```

### Database

```bash
docker compose -f infra/docker-compose.yml up -d postgres
pnpm db:generate        # generate the SQL migration from the Drizzle schema
pnpm db:migrate         # apply it
```

## Phase 1 — verify

```bash
# List the tools garmin-mcp exposes + a sample day of metrics.
pnpm verify:mcp -- 2026-05-22

# Run the daily reasoning loop and print the JSON result.
pnpm reason -- 2026-05-22

# Exercise the freshness gate (polls Garmin until last night's data syncs).
pnpm reason -- 2026-05-22 --wait
```

`runDailyReasoning(date)` pulls 7/30/90-day Garmin context, loads confirmed
agent memories as priors, asks Claude (`claude-sonnet-4-6`) for today's plan,
and writes `daily_snapshots`, `plans`, and any proposed memories (as `pending`).

## Full stack

```bash
docker compose -f infra/docker-compose.yml up -d
```

Phases 2–4 (Telegram bot, dashboard, cron + Caddy) are scaffolded but not yet
implemented — see `infra/docker-compose.yml` for the commented services.
