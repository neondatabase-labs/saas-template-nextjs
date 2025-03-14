"use server"

import { revalidatePath } from "next/cache"
import { db } from "./db"
import { todos, projects, users, type NewTodo, type NewProject } from "./schema"
import { eq, inArray, desc } from "drizzle-orm"
import { stackServerApp } from "@/stack"

export async function getTodos() {
  try {
    return await db.select().from(todos).orderBy(todos.id)
  } catch (error) {
    console.error("Failed to fetch todos:", error)
    return []
  }
}

export async function getProjects() {
  try {
    return await db.select().from(projects).orderBy(desc(projects.createdAt))
  } catch (error) {
    console.error("Failed to fetch projects:", error)
    return []
  }
}

export async function getUsers() {
  try {
    return await db.select().from(users).orderBy(users.name)
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return []
  }
}

export async function addTodo(formData: FormData) {
  const text = formData.get("text") as string
  const dueDateStr = formData.get("dueDate") as string | null
  const projectIdStr = formData.get("projectId") as string | null
  const assignedUserIdStr = formData.get("assignedUserId") as string | null

  if (!text?.trim()) {
    return { error: "Todo text is required" }
  }

  try {
    const newTodo: NewTodo = {
      text,
      // Convert the date string to a Date object if it exists
      dueDate: dueDateStr ? new Date(dueDateStr) : null,
      // Convert the project ID to a number if it exists
      projectId: projectIdStr ? Number.parseInt(projectIdStr) : null,
      // Convert the assigned user ID to a number if it exists
      assignedUserId: assignedUserIdStr ? Number.parseInt(assignedUserIdStr) : null,
    }
    await db.insert(todos).values(newTodo)
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to add todo:", error)
    return { error: "Failed to add todo" }
  }
}

export async function toggleTodo(id: number, completed: boolean) {
  // Don't try to update optimistic todos
  if (id < 0) return { success: false }

  try {
    await db.update(todos).set({ completed }).where(eq(todos.id, id))
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to toggle todo:", error)
    return { error: "Failed to update todo" }
  }
}

export async function deleteTodo(id: number) {
  // Don't try to delete optimistic todos
  if (id < 0) return { success: false }

  try {
    await db.delete(todos).where(eq(todos.id, id))
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete todo:", error)
    return { error: "Failed to delete todo" }
  }
}

export async function updateDueDate(id: number, dueDate: Date | null) {
  // Don't try to update optimistic todos
  if (id < 0) return { success: false }

  try {
    await db.update(todos).set({ dueDate }).where(eq(todos.id, id))
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to update due date:", error)
    return { error: "Failed to update due date" }
  }
}

export async function bulkUpdateDueDate(ids: number[], dueDate: Date | null) {
  // Filter out any negative IDs (optimistic todos)
  const validIds = ids.filter((id) => id > 0)

  if (validIds.length === 0) return { success: false }

  try {
    await db.update(todos).set({ dueDate }).where(inArray(todos.id, validIds))

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to bulk update due dates:", error)
    return { error: "Failed to reschedule todos" }
  }
}

export async function updateTodoProject(id: number, projectId: number | null) {
  // Don't try to update optimistic todos
  if (id < 0) return { success: false }

  try {
    await db.update(todos).set({ projectId }).where(eq(todos.id, id))
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to update todo project:", error)
    return { error: "Failed to update todo project" }
  }
}

export async function bulkUpdateProject(ids: number[], projectId: number | null) {
  // Filter out any negative IDs (optimistic todos)
  const validIds = ids.filter((id) => id > 0)

  if (validIds.length === 0) return { success: false }

  try {
    await db.update(todos).set({ projectId }).where(inArray(todos.id, validIds))

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to bulk update projects:", error)
    return { error: "Failed to move todos to project" }
  }
}

export async function updateAssignedUser(id: number, assignedUserId: number | null) {
  // Don't try to update optimistic todos
  if (id < 0) return { success: false }

  try {
    await db.update(todos).set({ assignedUserId }).where(eq(todos.id, id))
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to update assigned user:", error)
    return { error: "Failed to update assigned user" }
  }
}

export async function bulkUpdateAssignedUser(ids: number[], assignedUserId: number | null) {
  // Filter out any negative IDs (optimistic todos)
  const validIds = ids.filter((id) => id > 0)

  if (validIds.length === 0) return { success: false }

  try {
    await db.update(todos).set({ assignedUserId }).where(inArray(todos.id, validIds))

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to bulk update assigned users:", error)
    return { error: "Failed to assign todos to user" }
  }
}

export async function addProject(formData: FormData) {
  const name = formData.get("name") as string
  const color = formData.get("color") as string

  if (!name?.trim()) {
    return { error: "Project name is required" }
  }

  try {
    const newProject: NewProject = {
      name,
      color: color || "#4f46e5", // Default to indigo if no color provided
    }

    const result = await db.insert(projects).values(newProject).returning()
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
    await db.update(todos).set({ projectId: null }).where(eq(todos.projectId, id))

    // Then delete the project
    await db.delete(projects).where(eq(projects.id, id))

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete project:", error)
    return { error: "Failed to delete project" }
  }
}

export async function bulkToggleCompleted(ids: number[], completed: boolean) {
  // Filter out any negative IDs (optimistic todos)
  const validIds = ids.filter((id) => id > 0)

  if (validIds.length === 0) return { success: false }

  try {
    await db.update(todos).set({ completed }).where(inArray(todos.id, validIds))

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to bulk update completion status:", error)
    return { error: `Failed to mark todos as ${completed ? "completed" : "incomplete"}` }
  }
}

export async function createTeam(formData: FormData) {
  const name = formData.get("name") as string

  if (!name?.trim()) {
    return { error: "Team name is required" }
  }

  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return { error: "Not authenticated" }
    }

    const team = await user.createTeam({ name })
    revalidatePath("/settings")
    return { success: true, team }
  } catch (error) {
    console.error("Failed to create team:", error)
    return { error: "Failed to create team" }
  }
}

export async function leaveTeam(formData: FormData) {
  const teamId = formData.get("teamId") as string

  if (!teamId) {
    return { error: "Team ID is required" }
  }

  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return { error: "Not authenticated" }
    }

    const team = await user.getTeam(teamId)
    if (!team) {
      return { error: "Team not found" }
    }

    await user.leaveTeam(team)
    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Failed to leave team:", error)
    return { error: "Failed to leave team" }
  }
}
