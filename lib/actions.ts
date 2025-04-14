"use server"

import { revalidatePath } from "next/cache"
import { db } from "./db"
import { todos, projects, users_sync, user_metrics } from "./schema"
import { eq, desc, count, isNull } from "drizzle-orm"
import { getStripePlan } from "@/app/api/stripe/plans"
import { stackServerApp, getAccessToken } from "@/stack"
import { cookies } from "next/headers"

export async function getTodos() {
  const accessToken = await getAccessToken(await cookies())
  if (!accessToken) {
    throw new Error("Not authenticated")
  }

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

    // Count total todos 
    const totalTodos = await db.select({ count: count() }).from(todos).then(
      result => result[0]?.count ?? 0
    )
    
    const plan = await getStripePlan(user.id)
    if (totalTodos >= plan.todoLimit) {
      return { error: "You have reached your todo limit. Delete some todos to create new ones." }
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

export async function getTotalCreatedTodos() {
  const accessToken = await getAccessToken(await cookies())
  if (!accessToken) {
    throw new Error("Not authenticated")
  }

  try {
    const result = await db.$withAuth(accessToken).select({ count: count() }).from(todos)
    return result[0]?.count ?? 0
  } catch (error) {
    console.error("Failed to count todos:", error)
    return 0
  }
}

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
