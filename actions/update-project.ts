"use server"

import { db } from "@/lib/db"
import { todos } from "@/lib/schema"
import { inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { publishTask } from "@/app/api/queue/qstash"

export async function processProject(ids: number[], payload: { projectId: number | null }) {
  const validIds = ids.filter((id) => id > 0)
  if (validIds.length === 0) return

  await db.update(todos)
    .set({ projectId: payload.projectId })
    .where(inArray(todos.id, validIds))

  revalidatePath("/")
}

export async function updateTodoProject(id: number, payload: { projectId: number | null }) {
  // Don't try to update optimistic todos
  if (id < 0) return { success: false }

  try {
    await processProject([id], payload)
    return { success: true }
  } catch (error) {
    console.error("Failed to update todo project:", error)
    return { error: "Failed to update todo project" }
  }
}

export async function bulkUpdateProject(ids: number[], payload: { projectId: number | null }) {
  // Filter out any negative IDs (optimistic todos)
  const validIds = ids.filter((id) => id > 0)

  if (validIds.length === 0) return { success: false }

  try {
    const job = await publishTask({
      type: "updateProject",
      key: `update-project-${validIds.sort().join("-")}-${payload.projectId}`,
      ids: validIds,
      projectId: payload.projectId,
    })

    return { success: true, jobId: job.messageId }
  } catch (error) {
    console.error("Failed to bulk update projects:", error)
    return { error: "Failed to move todos to project" }
  }
} 
