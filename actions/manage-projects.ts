"use server"

import { db } from "@/lib/db/db"
import { projectsTable, todosTable } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { stackServerApp } from "@/lib/stack-auth/stack"

export async function addProject(payload: { name: string; color?: string; teamId: string }) {
	const { name, color, teamId } = payload

	if (!name?.trim()) {
		return { error: "Project name is required" }
	}

	if (!teamId) {
		return { error: "Team ID is required" }
	}

	// Verify user has access to this team
	const user = await stackServerApp.getUser({ or: "redirect" })
	const userTeam = await user.getTeam(teamId)
	if (!userTeam) {
		return { error: "You don't have access to this team" }
	}

	try {
		const result = await db
			.insert(projectsTable)
			.values({
				name,
				color: color || "#4f46e5", // Default to indigo if no color provided
				teamId,
			})
			.returning()

		revalidatePath("/")
		return { success: true, project: result[0] }
	} catch (error) {
		console.error("Failed to add project:", error)
		return { error: "Failed to add project" }
	}
}

export async function deleteProject(id: string) {
	try {
		// First, set projectId to null for all todos in this project
		await db.update(todosTable).set({ projectId: null }).where(eq(todosTable.projectId, id))

		// Then delete the project
		await db.delete(projectsTable).where(eq(projectsTable.id, id))

		revalidatePath("/")
		return { success: true }
	} catch (error) {
		console.error("Failed to delete project:", error)
		return { error: "Failed to delete project" }
	}
}
