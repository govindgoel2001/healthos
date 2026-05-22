# The bot worker — runs the Telegram bot + the 06:30 morning job. Needs uv so
# it can spawn garmin-mcp over stdio. This image also runs the DB migration
# and the `reason` / `verify:mcp` CLIs via `docker compose exec`.
FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates git \
  && rm -rf /var/lib/apt/lists/* \
  && curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:${PATH}"
RUN corepack enable

WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile

# Warm garmin-mcp so the first morning job is fast.
RUN uvx --python 3.12 --from git+https://github.com/Taxuspt/garmin_mcp garmin-mcp --help || true

CMD ["pnpm", "--filter", "@meteor/bot", "start"]
