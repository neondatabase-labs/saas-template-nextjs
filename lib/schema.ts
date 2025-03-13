import { text, boolean, pgTable, serial, timestamp, integer } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#4f46e5"), // Default indigo color
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const todos = pgTable("todos", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  completed: boolean("completed").default(false).notNull(),
  dueDate: timestamp("due_date"),
  projectId: integer("project_id").references(() => projects.id),
  assignedUserId: integer("assigned_user_id").references(() => users.id),
})

// Define relations
export const projectsRelations = relations(projects, ({ many }) => ({
  todos: many(todos),
}))

export const usersRelations = relations(users, ({ many }) => ({
  assignedTodos: many(todos, { relationName: "assignedTodos" }),
}))

export const todosRelations = relations(todos, ({ one }) => ({
  project: one(projects, {
    fields: [todos.projectId],
    references: [projects.id],
  }),
  assignedUser: one(users, {
    fields: [todos.assignedUserId],
    references: [users.id],
    relationName: "assignedTodos",
  }),
}))

export type Todo = typeof todos.$inferSelect
export type NewTodo = typeof todos.$inferInsert
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

