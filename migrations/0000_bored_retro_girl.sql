CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#4f46e5' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"owner_id" text
);
--> statement-breakpoint
CREATE TABLE "todos" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"due_date" timestamp,
	"project_id" integer,
	"user_id" text,
	"owner_id" text
);
--> statement-breakpoint
ALTER TABLE "todos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"todos_created" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "neon_auth.users_sync" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text,
	"name" text,
	"raw_json" jsonb NOT NULL,
	"created_at" timestamp,
	"deleted_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_user_id_neon_auth.users_sync_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."neon_auth.users_sync"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "view todos" ON "todos" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id() = owner_id));--> statement-breakpoint
CREATE POLICY "update todos" ON "todos" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = owner_id));--> statement-breakpoint
CREATE POLICY "delete todos" ON "todos" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id() = owner_id));