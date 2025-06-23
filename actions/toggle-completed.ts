"use server"

import { db } from "@/lib/db/db"
import { todosTable } from "@/lib/db/schema"
import { inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { publishTask } from "@/app/api/queue/qstash"

export async function processToggleCompleted(ids: string[], payload: { completed: boolean }) {
	if (ids.length === 0) return

	await db
		.update(todosTable)
		.set({ completed: payload.completed })
		.where(inArray(todosTable.id, ids))

	revalidatePath("/")
}

export async function toggleTodo(id: string, payload: { completed: boolean }) {
	try {
		await processToggleCompleted([id], payload)

		return { success: true }
	} catch (error) {
		console.error("Failed to toggle todo:", error)
		return { error: "Failed to update todo" }
	}
}

export async function bulkToggleCompleted(ids: string[], payload: { completed: boolean }) {
	if (ids.length === 0) return { success: false }

	try {
		const job = await publishTask({
			type: "toggleCompleted",
			key: `toggle-completed-${ids.sort().join("-")}`,
			ids,
			completed: payload.completed,
		})

		return { success: true, jobId: job.messageId }
	} catch (error) {
		console.error("Failed to bulk update completion status:", error)
		return { error: `Failed to mark todos as ${payload.completed ? "completed" : "incomplete"}` }
	}
}
