"use server"

import { db } from "@/lib/db/db"
import { todosTable } from "@/lib/db/schema"
import { inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { publishTask } from "@/app/api/queue/qstash"

export async function processProject(ids: string[], payload: { projectId: string | null }) {
	if (ids.length === 0) return

	await db
		.update(todosTable)
		.set({ projectId: payload.projectId })
		.where(inArray(todosTable.id, ids))

	revalidatePath("/")
}

export async function updateTodoProject(id: string, payload: { projectId: string | null }) {
	try {
		await processProject([id], payload)
		return { success: true }
	} catch (error) {
		console.error("Failed to update todo project:", error)
		return { error: "Failed to update todo project" }
	}
}

export async function bulkUpdateProject(ids: string[], payload: { projectId: string | null }) {
	if (ids.length === 0) return { success: false }

	try {
		const job = await publishTask({
			type: "updateProject",
			key: `update-project-${ids.sort().join("-")}-${payload.projectId}`,
			ids,
			projectId: payload.projectId,
		})

		return { success: true, jobId: job.messageId }
	} catch (error) {
		console.error("Failed to bulk update projects:", error)
		return { error: "Failed to move todos to project" }
	}
}
