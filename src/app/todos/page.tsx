import { TodoPage } from "./todo-page"
import { getTodos, getProjects, getUsers } from "@/lib/actions"

export default async function TodosPage() {
	// Fetch todos, projects, and users for the initial form state
	const [todos, projects, users] = await Promise.all([getTodos(), getProjects(), getUsers()])

	return <TodoPage todos={todos} projects={projects} users={users} />
}
