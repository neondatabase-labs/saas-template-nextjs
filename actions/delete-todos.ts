"use server"

import { db } from "@/lib/db"
import { todos } from "@/lib/schema"
import { inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { publishTask } from "@/app/api/queue/qstash"

export async function processDeleteTodos(ids: number[]) {
  const validIds = ids.filter((id) => id > 0)
  if (validIds.length === 0) return

  await db.delete(todos).where(inArray(todos.id, validIds))

  revalidatePath("/")
}

export async function deleteTodo(id: number) {
  // Don't try to delete optimistic todos
  if (id < 0) return { success: false }

  try {
    await processDeleteTodos([id])
    return { success: true }
  } catch (error) {
    console.error("Failed to delete todo:", error)
    return { error: "Failed to delete todo" }
  }
}

export async function bulkDeleteTodos(ids: number[]) {
  // Filter out any negative IDs (optimistic todos)
  const validIds = ids.filter((id) => id > 0)

  if (validIds.length === 0) return { success: false }

  try {
    const job = await publishTask({
      type: "deleteTodos",
      key: `delete-todos-${validIds.sort().join("-")}`,
      ids: validIds,
    })

    return { success: true, jobId: job.messageId }
  } catch (error) {
    console.error("Failed to bulk delete todos:", error)
    return { error: "Failed to delete todos" }
  }
} 
