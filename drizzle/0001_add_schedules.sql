ALTER TABLE "workflows" ADD COLUMN "next_run_at" timestamp;--> statement-breakpoint
CREATE INDEX "workflows_next_run_at_idx" ON "workflows" USING btree ("next_run_at");