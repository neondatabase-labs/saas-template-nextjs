import { StackAuthProvider } from "@/lib/stack-auth/stack"
import { stackServerApp } from "@/lib/stack-auth/stack"
import { ensureUserHasTeam } from "@/lib/stack-auth/utils"
import { AppLayoutClient } from "./layout-client"

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
	// Fetch user and teams data server-side
	const user = await stackServerApp.getUser()

	let teamsData: Array<{
		id: string
		displayName: string
		profileImageUrl: string | null
	}> = []

	let selectedTeamData: {
		id: string
		displayName: string
		profileImageUrl: string | null
	} | null = null

	if (user) {
		// Ensure user has a team (creates one if none exist, sets selected team)
		await ensureUserHasTeam(user.id)

		// Refetch user to get updated selected team
		const updatedUser = await stackServerApp.getUser(user.id)
		if (updatedUser) {
			const teams = await updatedUser.listTeams()
			teamsData = teams.map((team) => ({
				id: team.id,
				displayName: team.displayName,
				profileImageUrl: team.profileImageUrl,
			}))

			// At this point, we're guaranteed to have a selected team
			if (updatedUser.selectedTeam) {
				selectedTeamData = {
					id: updatedUser.selectedTeam.id,
					displayName: updatedUser.selectedTeam.displayName,
					profileImageUrl: updatedUser.selectedTeam.profileImageUrl,
				}
			}
		}
	}

	// If user is authenticated but no selected team, something went wrong
	if (user && !selectedTeamData) {
		throw new Error("Failed to ensure user has a selected team")
	}

	return (
		<StackAuthProvider>
			<AppLayoutClient
				teams={teamsData}
				selectedTeam={selectedTeamData || { id: "", displayName: "No Team", profileImageUrl: null }}
			>
				{children}
			</AppLayoutClient>
		</StackAuthProvider>
	)
}
