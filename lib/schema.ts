import { text, boolean, pgTable, serial, timestamp, integer, jsonb, pgPolicy } from "drizzle-orm/pg-core"
import { relations, sql } from "drizzle-orm"

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#4f46e5"), // Default indigo color
  createdAt: timestamp("created_at").defaultNow().notNull(),
  ownerId: text("owner_id"),
}, () => ({
  ownerFk: sql`FOREIGN KEY ("owner_id") REFERENCES "neon_auth"."users_sync"("id")`,
}))

// Define the neon_auth schema users_sync table
export const users_sync = pgTable("neon_auth.users_sync", {
  id: text("id").primaryKey(),
  email: text("email"), 
  name: text("name"),
  raw_json: jsonb("raw_json").notNull(),
  created_at: timestamp("created_at"),
  deleted_at: timestamp("deleted_at"),
  updated_at: timestamp("updated_at"),
})

// Separate table to track user metrics
export const user_metrics = pgTable("user_metrics", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  todosCreated: integer("todos_created").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, () => ({
  userFk: sql`FOREIGN KEY ("user_id") REFERENCES "neon_auth"."users_sync"("id")`,
}))

export const todos = pgTable("todos", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  completed: boolean("completed").default(false).notNull(),
  dueDate: timestamp("due_date"),
  projectId: integer("project_id").references(() => projects.id),
  userId: text("user_id").references(() => users_sync.id),
  ownerId: text("owner_id"),
}, () => ({
  ownerFk: sql`FOREIGN KEY ("owner_id") REFERENCES "neon_auth"."users_sync"("id")`,
  p1: pgPolicy("view todos", {
    for: "select",
    to: "authenticated",
    using: sql`(select auth.user_id() = owner_id)`,
  }),

  p2: pgPolicy("update todos", {
    for: "update",
    to: "authenticated",
    using: sql`(select auth.user_id() = owner_id)`,
  }),

  p3: pgPolicy("delete todos", {
    for: "delete",
    to: "authenticated",
    using: sql`(select auth.user_id() = owner_id)`,
  }),
}))

// Define relations
export const projectsRelations = relations(projects, ({ many }) => ({
  todos: many(todos),
}))

export const usersRelations = relations(users_sync, ({ many }) => ({
  assignedTodos: many(todos, { relationName: "assignedTodos" }),
  metrics: many(user_metrics, { relationName: "metrics" }),
}))

export const userMetricsRelations = relations(user_metrics, ({ one }) => ({
  user: one(users_sync, {
    fields: [user_metrics.userId],
    references: [users_sync.id],
    relationName: "metrics",
  }),
}))

export const todosRelations = relations(todos, ({ one }) => ({
  project: one(projects, {
    fields: [todos.projectId],
    references: [projects.id],
  }),
  user: one(users_sync, {
    fields: [todos.userId],
    references: [users_sync.id],
    relationName: "assignedTodos",
  }),
}))

export type Todo = typeof todos.$inferSelect
export type NewTodo = typeof todos.$inferInsert
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type User = typeof users_sync.$inferSelect
export type NewUser = typeof users_sync.$inferInsert
export type UserMetrics = typeof user_metrics.$inferSelect
export type NewUserMetrics = typeof user_metrics.$inferInsert
