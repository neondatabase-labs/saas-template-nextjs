"use server"

import { db } from "@/lib/db"
import { projects, todos } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function addProject(payload: { name: string; color?: string }) {
  const { name, color } = payload

  if (!name?.trim()) {
    return { error: "Project name is required" }
  }

  try {
    const result = await db.insert(projects)
      .values({
        name,
        color: color || "#4f46e5", // Default to indigo if no color provided
      })
      .returning()

    revalidatePath("/")
    return { success: true, project: result[0] }
  } catch (error) {
    console.error("Failed to add project:", error)
    return { error: "Failed to add project" }
  }
}

export async function deleteProject(id: number) {
  try {
    // First, set projectId to null for all todos in this project
    await db.update(todos)
      .set({ projectId: null })
      .where(eq(todos.projectId, id))

    // Then delete the project
    await db.delete(projects)
      .where(eq(projects.id, id))

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete project:", error)
    return { error: "Failed to delete project" }
  }
} 
