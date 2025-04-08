"use server"

import { db } from "@/lib/db"
import { todos } from "@/lib/schema"
import { inArray } from "drizzle-orm"
import { publishTask } from "@/app/api/queue/qstash"
import { revalidatePath } from "next/cache"

export async function processAssignedUser(ids: number[], payload: { assignedUserId: string | null }) {
  const validIds = ids.filter((id) => id > 0)
  if (validIds.length === 0) return

  await db.update(todos)
    .set({ assignedUserId: payload.assignedUserId })
    .where(inArray(todos.id, validIds))

  revalidatePath("/")
}

export async function updateAssignedUser(id: number, payload: { assignedUserId: string | null }) {
  // Don't try to update optimistic todos
  if (id < 0) return { success: false }

  try {
    await processAssignedUser([id], payload)
    return { success: true }
  } catch (error) {
    console.error("Failed to update assigned user:", error)
    return { error: "Failed to update assigned user" }
  }
}

export async function bulkUpdateAssignedUser(ids: number[], payload: { assignedUserId: string | null }) {
  // Filter out any negative IDs (optimistic todos)
  const validIds = ids.filter((id) => id > 0)

  if (validIds.length === 0) return { success: false }

  try {
    const job =  await publishTask({
      type: "updateAssignedUser",
      key: `update-assigned-user-${validIds.sort().join("-")}`,
      ids: validIds,
      assignedUserId: payload.assignedUserId,
    })

    return { success: true, jobId: job.messageId }
  } catch (error) {
    console.error("Failed to bulk update assigned users:", error)
    return { error: "Failed to assign todos to user" }
  }
} 
