import { Client } from "@upstash/qstash"
import { processDeleteTodos } from "@/actions/delete-todos"
import { processDueDate } from "@/actions/update-due-date"
import { processProject } from "@/actions/update-project"
import { processToggleCompleted } from "@/actions/toggle-completed"

export type QueueTask =
	| { type: "deleteTodo"; key: `delete-todo-${number}`; id: number }
	| { type: "deleteTodos"; key: `delete-todos-${string}`; ids: number[] }
	| {
			type: "updateDueDate"
			key: `update-due-date-${string}`
			ids: number[]
			dueDate: string | null
	  }
	| {
			type: "updateProject"
			key: `update-project-${string}`
			ids: number[]
			projectId: number | null
	  }
	| {
			type: "toggleCompleted"
			key: `toggle-completed-${string}`
			ids: number[]
			completed: boolean
	  }

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
	const url = new URL(`https://${process.env.VERCEL_URL}/api/queue`)

	const job = await client.publishJSON({
		url: url.toString(),
		body: task,
		deduplicationId: task.key,
		headers: {
			// Allows the queue to work in preview environments
			// https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation
			"x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET!,
		},
	})

	return job
}
