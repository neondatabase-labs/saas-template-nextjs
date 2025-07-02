import { stackServerApp } from "./stack"

export function getLoginUrl(afterAuthReturnTo: string) {
	return `${process.env.NEXT_PUBLIC_ORIGIN}/handler/login?after_auth_return_to=${encodeURIComponent(afterAuthReturnTo)}`
}

export async function ensureUserHasTeam(userId: string, teamId?: string | null) {
	const user = await stackServerApp.getUser(userId)
	if (!user) {
		throw new Error("User not found")
	}

	const teams = await user.listTeams()

	// If a specific teamId is requested, try to select that team
	if (teamId && user.selectedTeam?.id !== teamId) {
		const requestedTeam = teams.find((team) => team.id === teamId)
		if (requestedTeam) {
			await user.setSelectedTeam(requestedTeam)
			return requestedTeam
		}
		// If requested team not found, continue with normal flow
	}

	// If user has no teams, create a personal team
	if (teams.length === 0) {
		const personalTeam = await user.createTeam({
			displayName: `${user.displayName || "My"} Personal Team`,
		})
		await user.setSelectedTeam(personalTeam)
		return personalTeam
	}

	// If user has teams but no selected team, set the first one as selected
	if (!user.selectedTeam && teams.length > 0) {
		await user.setSelectedTeam(teams[0])
		return teams[0]
	}

	return user.selectedTeam || teams[0]
}

export async function getCurrentTeamOrRedirect() {
	const user = await stackServerApp.getUser()
	if (!user) {
		return null
	}

	return await ensureUserHasTeam(user.id)
}
