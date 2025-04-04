import { TodosPageClient } from "./page-client"
import { getTodos, getProjects, getUserTodoMetrics } from "@/lib/actions"
import { stackServerApp } from "@/stack"

export default async function TodosPage() {
	// Get current user
	const user = await stackServerApp.getUser()

	// Fetch todos, projects, and user's todo metrics
	const whenTodos = getTodos()
	const whenProjects = getProjects()
	const whenUserMetrics = user ? getUserTodoMetrics(user.id) : Promise.resolve(null)

	const [todos, projects, userMetrics] = await Promise.all([
		whenTodos,
		whenProjects,
		whenUserMetrics,
	])

	// Get the total created todos and todo limit from the user metrics
	const todoLimit = userMetrics && !("error" in userMetrics) ? userMetrics.todoLimit : 10

	return (
		<div className="container max-w-6xl mx-auto py-8 px-4">
			<TodosPageClient todos={todos} projects={projects} todoLimit={todoLimit} />
		</div>
	)
}
