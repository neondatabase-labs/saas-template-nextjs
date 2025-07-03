import { StackAuthProvider } from "@/lib/stack-auth/stack"
import { stackServerApp } from "@/lib/stack-auth/stack"
import { ensureUserHasTeam } from "@/lib/stack-auth/utils"
import { AppLayoutClient } from "./layout-client"

export default async function AuthLayout({
	children,
	params,
}: {
	children: React.ReactNode
	params: Promise<{ teamId: string | null | undefined }>
}) {
	const { teamId } = await params
	const user = await stackServerApp.getUser({ or: "redirect" })
	const selectedTeam = await ensureUserHasTeam(user, teamId)
	const teams = await user.listTeams()
	return (
		<StackAuthProvider>
			<AppLayoutClient
				teams={teams.map((team) => ({
					id: team.id,
					displayName: team.displayName,
					profileImageUrl: team.profileImageUrl,
				}))}
				selectedTeam={{
					id: selectedTeam.id,
					displayName: selectedTeam.displayName,
					profileImageUrl: selectedTeam.profileImageUrl,
				}}
			>
				{children}
			</AppLayoutClient>
		</StackAuthProvider>
	)
}
