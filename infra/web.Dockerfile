# The dashboard. Reads only from Postgres — no uv / garmin-mcp needed here.
FROM node:20-bookworm-slim AS build

RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @meteor/web build

FROM node:20-bookworm-slim AS run
RUN corepack enable
WORKDIR /app
COPY --from=build /app ./
ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "--filter", "@meteor/web", "start"]
