CREATE TYPE "public"."project_stage" AS ENUM('concept', 'prototype', 'beta', 'live');--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "problem_statement" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "project_stage" "project_stage";--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "help_types" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "help_request" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "highlights" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "next_milestone" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "feedback_request" text DEFAULT '' NOT NULL;