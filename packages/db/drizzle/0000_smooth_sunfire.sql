CREATE TYPE "public"."chat_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."memory_source" AS ENUM('derived', 'user');--> statement-breakpoint
CREATE TYPE "public"."memory_status" AS ENUM('pending', 'confirmed', 'dismissed');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" text PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"duration_minutes" integer NOT NULL,
	"distance_meters" real,
	"average_hr" integer,
	"raw_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fact" text NOT NULL,
	"confidence" real NOT NULL,
	"source" "memory_source" NOT NULL,
	"status" "memory_status" DEFAULT 'pending' NOT NULL,
	"confirmed_at" timestamp with time zone,
	"dismissed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" "chat_role" NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_snapshots" (
	"date" date PRIMARY KEY NOT NULL,
	"readiness" integer,
	"body_battery" integer,
	"hrv" integer,
	"rhr" integer,
	"sleep_minutes" integer,
	"sleep_score" integer,
	"strain" real,
	"steps" integer,
	"raw_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"date" date PRIMARY KEY NOT NULL,
	"plan_text" text NOT NULL,
	"reasoning_chain" jsonb NOT NULL,
	"delivered_to_telegram_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
