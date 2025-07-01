import { text, boolean, pgTable, timestamp, integer, uuid } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { usersSync as usersSyncTable } from "drizzle-orm/neon"

export { usersSyncTable }

// Helper functions for timestamps
const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
const updatedAt = timestamp("updated_at", { withTimezone: true })
	.notNull()
	.defaultNow()
	.$onUpdate(() => new Date())

export const projectsTable = pgTable("projects", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: text("name").notNull(),
	color: text("color").notNull().default("#4f46e5"), // Default indigo color
	teamId: text("team_id"), // Stack Auth team ID
	createdAt,
	updatedAt,
})

// Separate table to track user metrics
export const userMetricsTable = pgTable("user_metrics", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: text("user_id").references(() => usersSyncTable.id),
	todosCreated: integer("todos_created").default(0).notNull(),
	createdAt,
	updatedAt,
})

export const todosTable = pgTable("todos", {
	id: uuid("id").defaultRandom().primaryKey(),
	text: text("text").notNull(),
	completed: boolean("completed").default(false).notNull(),
	dueDate: timestamp("due_date"),
	projectId: uuid("project_id").references(() => projectsTable.id),
	teamId: text("team_id"), // Stack Auth team ID
	userId: text("user_id").references(() => usersSyncTable.id),
	createdAt,
	updatedAt,
})

export const stripeCustomersTable = pgTable("stripe_customers", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => usersSyncTable.id),
	stripeCustomerId: text("stripe_customer_id").notNull(),
	createdAt,
	updatedAt,
})

export const SUBSCRIPTION_STATUS = [
	"active",
	"canceled",
	"incomplete",
	"incomplete_expired",
	"past_due",
	"paused",
	"trialing",
	"unpaid",
] as const
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[number]

export const subscriptionsTable = pgTable("subscriptions", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: text("user_id")
		.notNull()
		.unique()
		.references(() => usersSyncTable.id),
	stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
	stripePriceId: text("stripe_price_id").notNull(),
	status: text("status", {
		enum: SUBSCRIPTION_STATUS,
	}).notNull(),
	currentPeriodStart: timestamp("current_period_start", { withTimezone: true }).notNull(),
	currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),
	cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
	createdAt,
	updatedAt,
})

// Define relations
export const projectsRelations = relations(projectsTable, ({ many }) => ({
	todos: many(todosTable),
}))

export const usersRelations = relations(usersSyncTable, ({ many }) => ({
	metrics: many(userMetricsTable, { relationName: "metrics" }),
	subscriptions: many(subscriptionsTable, { relationName: "subscriptions" }),
	stripeCustomers: many(stripeCustomersTable, { relationName: "stripeCustomers" }),
}))

export const userMetricsRelations = relations(userMetricsTable, ({ one }) => ({
	user: one(usersSyncTable, {
		fields: [userMetricsTable.userId],
		references: [usersSyncTable.id],
		relationName: "metrics",
	}),
}))

export const todosRelations = relations(todosTable, ({ one }) => ({
	project: one(projectsTable, {
		fields: [todosTable.projectId],
		references: [projectsTable.id],
		relationName: "todos",
	}),
}))

export const stripeCustomersRelations = relations(stripeCustomersTable, ({ one }) => ({
	user: one(usersSyncTable, {
		fields: [stripeCustomersTable.userId],
		references: [usersSyncTable.id],
		relationName: "stripeCustomers",
	}),
}))

export const subscriptionsRelations = relations(subscriptionsTable, ({ one }) => ({
	user: one(usersSyncTable, {
		fields: [subscriptionsTable.userId],
		references: [usersSyncTable.id],
		relationName: "subscriptions",
	}),
}))

export type User = typeof usersSyncTable.$inferSelect
export type NewUser = typeof usersSyncTable.$inferInsert
export type Todo = typeof todosTable.$inferSelect
export type NewTodo = typeof todosTable.$inferInsert
export type Project = typeof projectsTable.$inferSelect
export type NewProject = typeof projectsTable.$inferInsert
export type UserMetrics = typeof userMetricsTable.$inferSelect
export type NewUserMetrics = typeof userMetricsTable.$inferInsert
export type StripeCustomer = typeof stripeCustomersTable.$inferSelect
export type NewStripeCustomer = typeof stripeCustomersTable.$inferInsert
export type Subscription = typeof subscriptionsTable.$inferSelect
export type NewSubscription = typeof subscriptionsTable.$inferInsert
