"use server"

import { db } from "@/lib/db/db"
import { todosTable } from "@/lib/db/schema"
import { inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { publishTask } from "@/app/api/queue/qstash"

export async function processDueDate(ids: string[], payload: { dueDate: string | null }) {
	if (ids.length === 0) return

	await db
		.update(todosTable)
		.set({ dueDate: payload.dueDate ? new Date(payload.dueDate) : null })
		.where(inArray(todosTable.id, ids))

	revalidatePath("/app/teams", "layout")
}

export async function updateDueDate(id: string, payload: { dueDate: string | null }) {
	try {
		await processDueDate([id], payload)
		return { success: true }
	} catch (error) {
		console.error("Failed to update todo due date:", error)
		return { error: "Failed to update todo due date" }
	}
}

export async function bulkUpdateDueDate(ids: string[], payload: { dueDate: string | null }) {
	if (ids.length === 0) return { success: false }

	try {
		const job = await publishTask({
			type: "updateDueDate",
			key: `update-due-date-${ids.sort().join("-")}-${payload.dueDate}`,
			ids,
			dueDate: payload.dueDate,
		})

		return { success: true, jobId: job.messageId }
	} catch (error) {
		console.error("Failed to bulk update due dates:", error)
		return { error: "Failed to update due dates" }
	}
}
