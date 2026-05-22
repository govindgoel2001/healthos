# Meteor Health

A single-user personal HealthOS. The **Hermes** agent pulls Garmin data each
morning, reasons over it, sends a Telegram brief, and powers an ask-anything
dashboard.

> Data source: **Garmin Connect** via the [`Taxuspt/garmin_mcp`](https://github.com/Taxuspt/garmin_mcp)
> MCP server. Apple Watch support is deferred — `packages/mcp-client` is
> provider-abstracted so it can be added later.

## Layout

```
apps/web            Next.js 14 dashboard (today / trends / workouts / memory / review)
apps/bot            grammY Telegram bot + the 06:30 morning job
packages/agent      Hermes — runDailyReasoning, freshness gate, ask
packages/mcp-client Garmin MCP wrapper + HealthProvider interface
packages/db         Postgres schema + queries (Drizzle)
packages/shared     Types, voice rules, formatMetric, brief composer, ☾
infra               docker-compose, Dockerfiles, Caddy
```

## How it runs

- **06:30 daily** the bot worker runs the *freshness gate* — it polls Garmin
  Connect until last night's sleep has synced (the watch→phone→cloud lag),
  then runs `runDailyReasoning`, then sends the Telegram brief. If the sync
  window expires it nudges you to open Garmin Connect.
- `runDailyReasoning` pulls 7/30/90-day context, loads confirmed agent
  memories as priors, asks Claude (`claude-sonnet-4-6`) for today's plan, and
  writes `daily_snapshots`, `plans`, `activities`, and proposed memories.
- The dashboard reads only from Postgres. Replies to the bot and the
  ask-anything input both route to the agent's `answerQuestion`.

## Setup

A `Makefile` wraps the whole deploy:

```bash
make deploy     # creates .env on first run — fill in keys, then re-run
                # then: builds images, starts the stack, applies the schema
make auth       # one-time interactive Garmin login (email/password/MFA);
                # tokens persist ~6 months in the meteor-garmin-tokens volume
```

That's it — the bot is live on Telegram and the morning job is scheduled.

The raw equivalent, if you'd rather not use `make`:

```bash
cp .env.example .env          # ANTHROPIC_API_KEY, GARMIN_*, TELEGRAM_* …
docker compose -f infra/docker-compose.yml up -d --build
docker compose -f infra/docker-compose.yml exec bot pnpm db:migrate
docker compose -f infra/docker-compose.yml exec bot \
  uvx --python 3.12 --from git+https://github.com/Taxuspt/garmin_mcp garmin-mcp-auth
```

## Verify

```bash
make verify           # list garmin-mcp tools + a sample day of metrics
make reason           # run the daily reasoning loop, print JSON (DATE=YYYY-MM-DD)
make brief            # run the full morning job now + send the Telegram brief
make logs / make ps   # tail logs / show container status
```

On Telegram: send `/brief` to the bot, or just message it a question.

The dashboard is served by Caddy at `PUBLIC_BASE_URL` (point `infra/Caddyfile`
at your domain first), or directly from the `web` container on port 3000.

## Notes

- `garmin-mcp` exposes 110+ tools; the names in `packages/mcp-client/src/provider.ts`
  (`GARMIN_TOOLS`) are best-effort. `pnpm verify:mcp` prints the live list — if
  any differ, correct that map.
- The morning job's cron expression is `MORNING_CRON` (default `30 6 * * *`).
- No `export.xml` — Garmin is a live cloud API. Readiness is Garmin's native
  Training Readiness, passed through unchanged.

## Local development (without Docker)

```bash
pnpm install
pnpm db:migrate                      # needs DATABASE_URL + a running Postgres
GARMIN_MCP_TRANSPORT=stdio pnpm reason -- 2026-05-22
pnpm --filter @meteor/web dev        # dashboard on :3000
pnpm --filter @meteor/bot start      # bot worker
```
