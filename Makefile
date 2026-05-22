# Meteor Health — deploy shortcuts.
#   make deploy   first-time setup: build, start, migrate
#   make auth     one-time interactive Garmin login (MFA)
#   make verify   list garmin-mcp tools + a sample day
#   make brief    run the full morning job now
#   make logs / make ps / make down

COMPOSE := docker compose -f infra/docker-compose.yml
DATE    ?= $(shell date +%F)

.PHONY: deploy env up build migrate auth verify reason brief logs ps restart down

## First-time deploy: env check -> build+start -> migrate. Then run `make auth`.
deploy: env build up migrate
	@echo ""
	@echo "Stack is up. Next: run 'make auth' for the one-time Garmin login."

## Create .env from the template if it is missing.
env:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "Created .env from .env.example — fill in your keys, then re-run."; \
		exit 1; \
	fi

build:
	$(COMPOSE) build

up:
	$(COMPOSE) up -d

## Apply the database schema.
migrate:
	$(COMPOSE) exec bot pnpm db:migrate

## One-time interactive Garmin auth — prompts for email/password/MFA.
auth:
	$(COMPOSE) exec bot uvx --python 3.12 \
		--from git+https://github.com/Taxuspt/garmin_mcp garmin-mcp-auth

## List the tools garmin-mcp exposes + a sample day of metrics.
verify:
	$(COMPOSE) exec bot pnpm verify:mcp -- $(DATE)

## Run the daily reasoning loop once and print JSON. Override with DATE=YYYY-MM-DD.
reason:
	$(COMPOSE) exec bot pnpm reason -- $(DATE)

## Run the full morning job now: reasoning + freshness gate + Telegram brief.
brief:
	$(COMPOSE) exec bot pnpm --filter @meteor/bot brief

logs:
	$(COMPOSE) logs -f --tail=100

ps:
	$(COMPOSE) ps

restart:
	$(COMPOSE) restart

down:
	$(COMPOSE) down
