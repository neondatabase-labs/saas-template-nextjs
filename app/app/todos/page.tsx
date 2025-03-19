import { TodosPageClient } from "./page-client"
import { getTodos, getProjects } from "@/lib/actions"

export default async function TodosPage() {
	// Fetch todos and projects for the initial form state
	const whenTodos = getTodos()
	const whenProjects = getProjects()

	return (
		<div className="container max-w-6xl mx-auto py-8 px-4">
			<TodosPageClient todos={await whenTodos} projects={await whenProjects} />
		</div>
	)
}
