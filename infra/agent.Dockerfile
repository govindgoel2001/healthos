# The agent image. Node for the Hermes agent + uv so it can spawn garmin-mcp
# over stdio. No other Python lives in this repo.
FROM node:20-bookworm-slim

# uv — used to run Taxuspt/garmin_mcp via `uvx`.
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates git \
  && rm -rf /var/lib/apt/lists/* \
  && curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:${PATH}"

RUN corepack enable

WORKDIR /app
COPY pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY infra/cron ./infra/cron
RUN pnpm install --frozen-lockfile || pnpm install

# Warm the garmin-mcp package so first run is fast.
RUN uvx --python 3.12 --from git+https://github.com/Taxuspt/garmin_mcp garmin-mcp --help || true

# Phase 1: the agent is invoked on demand (cron job / `pnpm reason`). The
# container stays up so those commands can `docker compose exec` into it.
# Phase 4 replaces this with the Hono server + cron entrypoint.
CMD ["sleep", "infinity"]
