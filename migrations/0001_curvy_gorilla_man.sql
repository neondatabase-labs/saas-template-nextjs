ALTER TABLE "todos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "todos" RENAME COLUMN "assigned_user_id" TO "user_id";--> statement-breakpoint
ALTER TABLE "todos" DROP CONSTRAINT "todos_assigned_user_id_neon_auth.users_sync_id_fk";
--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_user_id_neon_auth.users_sync_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."neon_auth.users_sync"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "view todos" ON "todos" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id() = user_id));--> statement-breakpoint
CREATE POLICY "update todos" ON "todos" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = user_id));--> statement-breakpoint
CREATE POLICY "delete todos" ON "todos" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id() = user_id));