ALTER TYPE "public"."document_status" ADD VALUE 'queued' BEFORE 'processing';--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."document_type";--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('pdf', 'docx', 'txt', 'web', 'youtube');--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "type" SET DATA TYPE "public"."document_type" USING "type"::"public"."document_type";--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "status" SET DEFAULT 'queued';--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "storage_key" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "original_file_name" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "mime_type" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "file_size_bytes" integer;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "error_message" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "processed_at" timestamp;