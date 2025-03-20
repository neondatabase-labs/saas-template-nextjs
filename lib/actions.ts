"use server"

import { revalidatePath } from "next/cache"
import { db } from "./db"
import { todos, projects, users_sync, user_metrics, type NewTodo, type NewProject } from "./schema"
import { eq, inArray, desc, count, and, isNull } from "drizzle-orm"
import { getStripePlan } from "@/app/api/stripe/client"
import { stackServerApp } from "@/stack"

// Function to get a user's todo limit based on their auth ID
async function getUserTodoLimit(userId: string): Promise<number> {
  try {
    // Get the user's subscription plan from Stripe
    const plan = await getStripePlan(userId)
    
    // Return the todo limit from the plan
    return plan.todoLimit
  } catch (error) {
    console.error("Failed to get user todo limit:", error)
    // Default to FREE plan limit of 10 in case of error
    return 10
  }
}

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
    return await db.select().from(users_sync)
      .where(isNull(users_sync.deleted_at))
      .orderBy(users_sync.name)
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return []
  }
}

export async function addTodo(formData: FormData) {
  const text = formData.get("text") as string
  const dueDateStr = formData.get("dueDate") as string | null
  const projectIdStr = formData.get("projectId") as string | null

  if (!text?.trim()) {
    return { error: "Todo text is required" }
  }

  const user = await stackServerApp.getUser({ or: "redirect" })
  if (!user) {
    return { error: "User not found" }
  }

  try {
    let userMetrics = await db.query.user_metrics.findFirst({
      where: eq(user_metrics.userId, user.id)
    })
    
    if (!userMetrics) {
      // Create initial metrics record for user
      const [newMetrics] = await db.insert(user_metrics)
        .values({ userId: user.id, todosCreated: 0 })
        .returning()
      userMetrics = newMetrics
    }

    const plan = await getStripePlan(user.id)
    if (userMetrics.todosCreated >= plan.todoLimit) {
      return { error: "You have reached your todo creation limit" }
    }
    
    await db.insert(todos).values({
      text,
      dueDate: dueDateStr ? new Date(dueDateStr) : null,
      projectId: projectIdStr ? Number.parseInt(projectIdStr) : null,
    })
    

    await db.update(user_metrics)
      .set({ 
        todosCreated: userMetrics.todosCreated + 1,
        updatedAt: new Date()
      })
      .where(eq(user_metrics.id, userMetrics.id))
    
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

export async function updateAssignedUser(id: number, assignedUserId: string | null) {
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

export async function bulkUpdateAssignedUser(ids: number[], assignedUserId: string | null) {
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

export async function getTotalCreatedTodos() {
  try {
    const result = await db.select({ count: count() }).from(todos)
    return result[0]?.count ?? 0
  } catch (error) {
    console.error("Failed to count todos:", error)
    return 0
  }
}

// Get current user's total created todos count
export async function getCurrentUserTodosCreated() {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return 0
    }
    
    const userMetrics = await db.query.user_metrics.findFirst({
      where: eq(user_metrics.userId, user.id)
    })
    
    return userMetrics?.todosCreated ?? 0
  } catch (error) {
    console.error("Failed to get user's total created todos:", error)
    return 0
  }
}

export async function getUserTodoMetrics(userId: string) {
  try {
    const user = await db.query.users_sync.findFirst({
      where: eq(users_sync.id, userId)
    })
    
    if (!user) {
      return { error: "User not found" }
    }
    
    // Get or create user metrics
    let userMetrics = await db.query.user_metrics.findFirst({
      where: eq(user_metrics.userId, userId)
    })
    
    if (!userMetrics) {
      // Create initial metrics record for user
      const [newMetrics] = await db.insert(user_metrics)
        .values({ userId, todosCreated: 0 })
        .returning()
      userMetrics = newMetrics
    }
    
    // Get the user's plan details
    const plan = await getStripePlan(userId)
    
    return { 
      todosCreated: userMetrics.todosCreated,
      todoLimit: plan.todoLimit,
      remaining: plan.todoLimit - userMetrics.todosCreated,
      subscription: plan.id
    }
  } catch (error) {
    console.error("Failed to get user todo metrics:", error)
    return { error: "Failed to get user metrics" }
  }
}

export async function resetUserTodosCreated(userId: string) {
  try {
    // Find the user metrics
    const userMetrics = await db.query.user_metrics.findFirst({
      where: eq(user_metrics.userId, userId)
    })
    
    if (userMetrics) {
      // Update existing metrics
      await db.update(user_metrics)
        .set({ 
          todosCreated: 0,
          updatedAt: new Date()
        })
        .where(eq(user_metrics.id, userMetrics.id))
    } else {
      // Create new metrics with 0 todos
      await db.insert(user_metrics)
        .values({ userId, todosCreated: 0 })
    }
      
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to reset user todos created count:", error)
    return { error: "Failed to reset todos created count" }
  }
}
