import { TodoPage } from "./page-client"
import { getTodos, getProjects, getUsers } from "@/lib/actions"

export default async function TodosPage() {
	// Fetch todos, projects, and users for the initial form state
	const whenTodos = getTodos()
	const whenProjects = getProjects()
	const whenUsers = getUsers()

	return (
		<div className="container max-w-6xl mx-auto py-8 px-4">
			<TodoPage todos={await whenTodos} projects={await whenProjects} users={await whenUsers} />
		</div>
	)
}
