"use server"

import { db } from "@/lib/db/db"
import { todosTable } from "@/lib/db/schema"
import { inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { publishTask } from "@/app/api/queue/qstash"

export async function processDeleteTodos(ids: string[]) {
	if (ids.length === 0) return

	await db.delete(todosTable).where(inArray(todosTable.id, ids))

	revalidatePath("/")
}

export async function deleteTodo(id: string) {
	try {
		await processDeleteTodos([id])
		return { success: true }
	} catch (error) {
		console.error("Failed to delete todo:", error)
		return { error: "Failed to delete todo" }
	}
}

export async function bulkDeleteTodos(ids: string[]) {
	if (ids.length === 0) return { success: false }

	try {
		const job = await publishTask({
			type: "deleteTodos",
			key: `delete-todos-${ids.sort().join("-")}`,
			ids,
		})

		return { success: true, jobId: job.messageId }
	} catch (error) {
		console.error("Failed to bulk delete todos:", error)
		return { error: "Failed to delete todos" }
	}
}
