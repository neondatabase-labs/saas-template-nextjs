import { redirect } from "next/navigation"
import { stackServerApp } from "@/lib/stack-auth/stack"
import { getPlansFlag, getStripePlan } from "@/lib/stripe/plans"
import { SettingsPageClient } from "./page-client"
import { verifyContactChannel } from "./actions"
import { getTodos, getUserTodoMetrics } from "@/lib/actions"

export default async function SettingsPage({
	searchParams: searchParamsPromise,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
	const searchParams = await searchParamsPromise
	const user = await stackServerApp.getUser({ or: "redirect" })

	if (searchParams.code && !Array.isArray(searchParams.code)) {
		// Handle contact channel verification
		await verifyContactChannel({ code: searchParams.code })
		redirect("/app/settings")
	}

	const [userPlan, plansFlag] = await Promise.all([getStripePlan(user?.id), getPlansFlag()])
	const plans = await plansFlag()
	const contactChannels = await user?.listContactChannels()

	// Get user's teams
	const teams = await user?.listTeams()

	// Get user's todo metrics
	const whenUserMetrics = user ? getUserTodoMetrics(user.id) : Promise.resolve(null)
	// Fetch todos, projects, and user's todo metrics
	const whenTodos = getTodos()
	const [todos, userMetrics] = await Promise.all([whenTodos, whenUserMetrics])

	const todoLimit = userMetrics && !("error" in userMetrics) ? userMetrics.todoLimit : 10

	return (
		<SettingsPageClient
			planId={userPlan.id}
			contactChannels={
				contactChannels?.map((channel) => ({
					id: channel.id,
					value: channel.value,
					type: channel.type,
					isPrimary: channel.isPrimary,
					isVerified: channel.isVerified,
					usedForAuth: channel.usedForAuth,
				})) ?? []
			}
			teams={
				teams?.map((team) => ({
					id: team.id,
					displayName: team.displayName,
					profileImageUrl: team.profileImageUrl,
					isSelected: user?.selectedTeam?.id === team.id,
				})) ?? []
			}
			todoMetrics={{
				todosCreated: todos.length,
				todoLimit,
				remaining: todoLimit - todos.length,
				subscription: userPlan.id,
			}}
			plans={plans}
		/>
	)
}
