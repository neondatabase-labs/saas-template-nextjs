ALTER TABLE "projects" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_neon_auth.users_sync_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."neon_auth.users_sync"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_owner_id_neon_auth.users_sync_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."neon_auth.users_sync"("id") ON DELETE no action ON UPDATE no action;