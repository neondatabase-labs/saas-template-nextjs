"use server"

import { revalidatePath } from "next/cache"
import { db } from "./db/db"
import { todosTable, projectsTable, usersSyncTable, userMetricsTable } from "./db/schema"
import { eq, desc, count, isNull } from "drizzle-orm"
import { getStripePlan } from "@/lib/stripe/plans"
import { stackServerApp, getAccessToken } from "@/lib/stack-auth/stack"
import { cookies } from "next/headers"

export async function getTodos() {
	const accessToken = await getAccessToken(await cookies())
	if (!accessToken) {
		throw new Error("Not authenticated")
	}

	try {
		return await db.select().from(todosTable).orderBy(todosTable.id)
	} catch (error) {
		console.error("Failed to fetch todos:", error)
		return []
	}
}

export async function getProjects() {
	try {
		return await db.select().from(projectsTable).orderBy(desc(projectsTable.createdAt))
	} catch (error) {
		console.error("Failed to fetch projects:", error)
		return []
	}
}

export async function getUsers() {
	try {
		return await db
			.select()
			.from(usersSyncTable)
			.where(isNull(usersSyncTable.deletedAt))
			.orderBy(usersSyncTable.name)
	} catch (error) {
		console.error("Failed to fetch users:", error)
		return []
	}
}

export async function addTodo(formData: FormData) {
	const text = formData.get("text") as string
	const dueDateStr = formData.get("dueDate") as string | null
	const projectId = formData.get("projectId") as string | null
	const teamId = formData.get("teamId") as string | null

	if (!text?.trim()) {
		return { error: "Todo text is required" }
	}

	if (!teamId) {
		return { error: "Team ID is required" }
	}

	const user = await stackServerApp.getUser({ or: "redirect" })
	if (!user) {
		return { error: "User not found" }
	}

	// Verify user has access to this team
	const userTeam = await user.getTeam(teamId)
	if (!userTeam) {
		return { error: "You don't have access to this team" }
	}

	try {
		let userMetrics = await db.query.userMetricsTable.findFirst({
			where: eq(userMetricsTable.userId, user.id),
		})

		if (!userMetrics) {
			// Create initial metrics record for user
			const [newMetrics] = await db
				.insert(userMetricsTable)
				.values({ userId: user.id, todosCreated: 0 })
				.returning()
			userMetrics = newMetrics
		}

		// Count total todos for this user
		const totalTodos = await db
			.select({ count: count() })
			.from(todosTable)
			.where(eq(todosTable.userId, user.id))
			.then((result) => result[0]?.count ?? 0)

		const plan = await getStripePlan(user.id)
		if (totalTodos >= plan.todoLimit) {
			return { error: "You have reached your todo limit. Delete some todos to create new ones." }
		}

		await db.insert(todosTable).values({
			text,
			dueDate: dueDateStr ? new Date(dueDateStr) : null,
			projectId,
			teamId,
			userId: user.id,
		})

		await db
			.update(userMetricsTable)
			.set({
				todosCreated: userMetrics.todosCreated + 1,
				updatedAt: new Date(),
			})
			.where(eq(userMetricsTable.id, userMetrics.id))

		revalidatePath(`/app/teams/${teamId}/todos`)
		return { success: true }
	} catch (error) {
		console.error("Failed to add todo:", error)
		return { error: "Failed to add todo" }
	}
}

export async function getTotalCreatedTodos() {
	const accessToken = await getAccessToken(await cookies())
	if (!accessToken) {
		throw new Error("Not authenticated")
	}

	try {
		const result = await db.$withAuth(accessToken).select({ count: count() }).from(todosTable)
		return result[0]?.count ?? 0
	} catch (error) {
		console.error("Failed to count todos:", error)
		return 0
	}
}

export async function getCurrentUserTodosCreated() {
	try {
		const user = await stackServerApp.getUser()
		if (!user) {
			return 0
		}

		const userMetrics = await db.query.userMetricsTable.findFirst({
			where: eq(userMetricsTable.userId, user.id),
		})

		return userMetrics?.todosCreated ?? 0
	} catch (error) {
		console.error("Failed to get user's total created todos:", error)
		return 0
	}
}

export async function getUserTodoMetrics(userId: string) {
	try {
		// Get or create user metrics
		let userMetrics = await db.query.userMetricsTable.findFirst({
			where: eq(userMetricsTable.userId, userId),
		})

		if (!userMetrics) {
			// Create initial metrics record for user
			const [newMetrics] = await db
				.insert(userMetricsTable)
				.values({ userId, todosCreated: 0 })
				.returning()
			userMetrics = newMetrics
		}

		// Get the user's plan details
		const plan = await getStripePlan(userId)

		return {
			todosCreated: userMetrics.todosCreated,
			todoLimit: plan.todoLimit,
			subscription: plan.id,
		}
	} catch (error) {
		console.error("Failed to get user todo metrics:", error)
		return { error: "Failed to get user metrics" }
	}
}

export async function resetUserTodosCreated(userId: string) {
	try {
		// Find the user metrics
		const userMetrics = await db.query.userMetricsTable.findFirst({
			where: eq(userMetricsTable.userId, userId),
		})

		if (userMetrics) {
			// Update existing metrics
			await db
				.update(userMetricsTable)
				.set({
					todosCreated: 0,
					updatedAt: new Date(),
				})
				.where(eq(userMetricsTable.id, userMetrics.id))
		} else {
			// Create new metrics with 0 todos
			await db.insert(userMetricsTable).values({ userId, todosCreated: 0 })
		}

		revalidatePath("/")
		return { success: true }
	} catch (error) {
		console.error("Failed to reset user todos created count:", error)
		return { error: "Failed to reset todos created count" }
	}
}
