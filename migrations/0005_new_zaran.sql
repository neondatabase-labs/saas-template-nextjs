ALTER TABLE "projects" DROP CONSTRAINT "projects_owner_id_neon_auth.users_sync_id_fk";
--> statement-breakpoint
ALTER TABLE "user_metrics" DROP CONSTRAINT "user_metrics_user_id_neon_auth.users_sync_id_fk";
--> statement-breakpoint
ALTER TABLE "user_metrics" ALTER COLUMN "user_id" DROP NOT NULL;