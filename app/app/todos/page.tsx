import { stackServerApp } from "@/lib/stack-auth/stack"
import { redirect } from "next/navigation"
import { ensureUserHasTeam } from "@/lib/stack-auth/utils"

export default async function TodosPage() {
	const user = await stackServerApp.getUser({ or: "redirect" })

	// Ensure user has a team and get their current team
	const currentTeam = await ensureUserHasTeam(user)

	// Redirect to their current team's todos
	redirect(`/app/teams/${currentTeam.id}/todos`)
}
