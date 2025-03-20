import { TodosPageClient } from "./page-client"
import { getTodos, getProjects, getCurrentUserTodosCreated } from "@/lib/actions"

export default async function TodosPage() {
	// Fetch todos, projects, and user's created todos count
	const whenTodos = getTodos()
	const whenProjects = getProjects()
	const whenTotalCreatedTodos = getCurrentUserTodosCreated()

	return (
		<div className="container max-w-6xl mx-auto py-8 px-4">
			<TodosPageClient
				todos={await whenTodos}
				projects={await whenProjects}
				totalCreatedTodos={await whenTotalCreatedTodos}
			/>
		</div>
	)
}
