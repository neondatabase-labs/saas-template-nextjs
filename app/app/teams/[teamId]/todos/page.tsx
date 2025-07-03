import { db } from "@/lib/db/db"
import { todosTable, projectsTable } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { TodosPageClient } from "./page-client"
import { stackServerApp } from "@/lib/stack-auth/stack"
import { redirect } from "next/navigation"
import { ensureUserHasTeam } from "@/lib/stack-auth/utils"

async function getTodosAndProjects(teamId: string, userId: string) {
	const [todos, projects] = await Promise.all([
		db
			.select({
				id: todosTable.id,
				text: todosTable.text,
				completed: todosTable.completed,
				dueDate: todosTable.dueDate,
				projectId: todosTable.projectId,
				teamId: todosTable.teamId,
				userId: todosTable.userId,
				createdAt: todosTable.createdAt,
				updatedAt: todosTable.updatedAt,
			})
			.from(todosTable)
			.where(and(eq(todosTable.teamId, teamId), eq(todosTable.userId, userId)))
			.orderBy(desc(todosTable.createdAt)),
		db
			.select({
				id: projectsTable.id,
				name: projectsTable.name,
				color: projectsTable.color,
				teamId: projectsTable.teamId,
				createdAt: projectsTable.createdAt,
				updatedAt: projectsTable.updatedAt,
			})
			.from(projectsTable)
			.where(eq(projectsTable.teamId, teamId))
			.orderBy(desc(projectsTable.createdAt)),
	])

	return { todos, projects }
}

export default async function TeamTodosPage({
	params: paramsPromise,
}: {
	params: Promise<{ teamId: string }>
}) {
	const user = await stackServerApp.getUser({ or: "redirect" })
	const params = await paramsPromise
	const { teamId } = params

	// Verify user has access to this team
	const userTeam = user.getTeam ? await user.getTeam(teamId) : null
	if (!userTeam) {
		// If team not found, redirect to ensure user has a team
		await ensureUserHasTeam(user)
		redirect("/app")
	}

	// Ensure this team is selected
	if (user.selectedTeam?.id !== teamId) {
		await user.setSelectedTeam(userTeam)
	}

	const { todos, projects } = await getTodosAndProjects(teamId, user.id)

	// TODO: Get todo limit from subscription
	const todoLimit = 10

	return (
		<div className="mx-auto max-w-5xl px-4 py-8">
			<div className="flex items-center justify-between mb-8">
				<h1 className="text-2xl font-semibold">Deadlines</h1>
				<div className="text-sm text-gray-500">Team: {userTeam.displayName}</div>
			</div>
			<main>
				<TodosPageClient todos={todos} projects={projects} todoLimit={todoLimit} teamId={teamId} />
			</main>
		</div>
	)
}
