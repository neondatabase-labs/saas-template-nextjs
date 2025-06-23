"use server"

import { db } from "@/lib/db"
import { todos } from "@/lib/schema"
import { inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { publishTask } from "@/app/api/queue/qstash"

export async function processToggleCompleted(ids: number[], payload: { completed: boolean }) {
	const validIds = ids.filter((id) => id > 0)
	if (validIds.length === 0) return

	await db.update(todos).set({ completed: payload.completed }).where(inArray(todos.id, validIds))

	revalidatePath("/")
}

export async function toggleTodo(id: number, payload: { completed: boolean }) {
	// Don't try to update optimistic todos
	if (id < 0) return { success: false }

	try {
		await processToggleCompleted([id], payload)

		return { success: true }
	} catch (error) {
		console.error("Failed to toggle todo:", error)
		return { error: "Failed to update todo" }
	}
}

export async function bulkToggleCompleted(ids: number[], payload: { completed: boolean }) {
	// Filter out any negative IDs (optimistic todos)
	const validIds = ids.filter((id) => id > 0)

	if (validIds.length === 0) return { success: false }

	try {
		const job = await publishTask({
			type: "toggleCompleted",
			key: `toggle-completed-${validIds.sort().join("-")}`,
			ids: validIds,
			completed: payload.completed,
		})

		return { success: true, jobId: job.messageId }
	} catch (error) {
		console.error("Failed to bulk update completion status:", error)
		return { error: `Failed to mark todos as ${payload.completed ? "completed" : "incomplete"}` }
	}
}
