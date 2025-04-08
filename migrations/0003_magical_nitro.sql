ALTER POLICY "view todos" ON "todos" TO authenticated USING ((select auth.user_id() = owner_id));--> statement-breakpoint
ALTER POLICY "update todos" ON "todos" TO authenticated USING ((select auth.user_id() = owner_id));--> statement-breakpoint
ALTER POLICY "delete todos" ON "todos" TO authenticated USING ((select auth.user_id() = owner_id));