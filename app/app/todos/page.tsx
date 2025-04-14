import { TodosPageClient } from "./page-client"
import { getTodos, getProjects, getUserTodoMetrics } from "@/lib/actions"
import { stackServerApp } from "@/stack"

export default async function TodosPage() {
	const user = await stackServerApp.getUser()

	const [todos, projects, userMetrics] = await Promise.all([
		getTodos(),
		getProjects(),
		user ? getUserTodoMetrics(user.id) : Promise.resolve(null),
	])

	// Get the total created todos and todo limit from the user metrics
	const todoLimit = userMetrics && !("error" in userMetrics) ? userMetrics.todoLimit : 10

	return <TodosPageClient todos={todos} projects={projects} todoLimit={todoLimit} />
}
