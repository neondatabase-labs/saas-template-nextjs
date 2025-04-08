import { Client } from "@upstash/qstash"
import { processDeleteTodos } from "@/actions/delete-todos"
import { processDueDate } from "@/actions/update-due-date"
import { processProject } from "@/actions/update-project"
import { processToggleCompleted } from "@/actions/toggle-completed"
import { processAssignedUser } from "@/actions/update-assigned-user"

export type QueueTask = 
  | { type: "deleteTodo"; key: `delete-todo-${number}`; id: number }
  | { type: "deleteTodos"; key: `delete-todos-${string}`; ids: number[] }
  | { type: "updateDueDate"; key: `update-due-date-${string}`; ids: number[]; dueDate: string | null }
  | { type: "updateProject"; key: `update-project-${string}`; ids: number[]; projectId: number | null }
  | { type: "toggleCompleted"; key: `toggle-completed-${string}`; ids: number[]; completed: boolean }
  | { type: "updateAssignedUser"; key: `update-assigned-user-${string}`; ids: number[]; assignedUserId: string | null }

export async function processTask(task: QueueTask) {
  try {
    switch (task.type) {
      case "deleteTodos":
        await processDeleteTodos(task.ids)
        break
      case "updateDueDate":
        await processDueDate(task.ids, { dueDate: task.dueDate })
        break
      case "updateProject":
        await processProject(task.ids, { projectId: task.projectId })
        break
      case "toggleCompleted":
        await processToggleCompleted(task.ids, { completed: task.completed })
        break
      case "updateAssignedUser":
        await processAssignedUser(task.ids, { assignedUserId: task.assignedUserId })
        break
      default: {
        throw new Error(`Unknown task type: ${task.type}`)
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error processing task:", error)
    return { error: "Failed to process task" }
  }
}

const client = new Client({
  token: process.env.QSTASH_TOKEN!,
})

export async function publishTask<T extends QueueTask>(task: T) {
  console.log("Publishing task:", process.env.VERCEL_URL)
  const url = new URL(`https://${process.env.VERCEL_URL}/api/queue`)

  const job = await client.publishJSON({
    url: url.toString(),
    body: task,
    deduplicationId: task.key,
  })

  return job
}
