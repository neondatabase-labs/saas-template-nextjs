"use server"

import { db } from "@/lib/db"
import { todos } from "@/lib/schema"
import { inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { publishTask } from "@/app/api/queue/qstash"

export async function processDueDate(ids: number[], payload: { dueDate: string | null }) {
	const validIds = ids.filter((id) => id > 0)
	if (validIds.length === 0) return

	await db
		.update(todos)
		.set({ dueDate: payload.dueDate ? new Date(payload.dueDate) : null })
		.where(inArray(todos.id, validIds))

	revalidatePath("/")
}

export async function updateDueDate(id: number, payload: { dueDate: string | null }) {
	// Don't try to update optimistic todos
	if (id < 0) return { success: false }

	try {
		await processDueDate([id], payload)
		return { success: true }
	} catch (error) {
		console.error("Failed to update todo due date:", error)
		return { error: "Failed to update todo due date" }
	}
}

export async function bulkUpdateDueDate(ids: number[], payload: { dueDate: string | null }) {
	// Filter out any negative IDs (optimistic todos)
	const validIds = ids.filter((id) => id > 0)

	if (validIds.length === 0) return { success: false }

	try {
		const job = await publishTask({
			type: "updateDueDate",
			key: `update-due-date-${validIds.sort().join("-")}-${payload.dueDate}`,
			ids: validIds,
			dueDate: payload.dueDate,
		})

		return { success: true, jobId: job.messageId }
	} catch (error) {
		console.error("Failed to bulk update due dates:", error)
		return { error: "Failed to update due dates" }
	}
}
