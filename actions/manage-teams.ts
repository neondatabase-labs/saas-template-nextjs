"use server"

import { stackServerApp } from "@/lib/stack-auth/stack"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createTeam(formData: FormData) {
	const teamName = formData.get("teamName") as string

	if (!teamName?.trim()) {
		return { error: "Team name is required" }
	}

	try {
		const user = await stackServerApp.getUser({ or: "redirect" })
		if (!user) {
			return { error: "User not found" }
		}

		// Create the team using Stack Auth
		const newTeam = await user.createTeam({
			displayName: teamName.trim(),
		})

		// Set the new team as selected
		await user.setSelectedTeam(newTeam)

		revalidatePath("/", "layout")

		return {
			success: true,
			team: {
				id: newTeam.id,
				displayName: newTeam.displayName,
				profileImageUrl: newTeam.profileImageUrl,
			},
		}
	} catch (error) {
		console.error("Failed to create team:", error)
		return { error: "Failed to create team" }
	}
}

export async function deleteTeam(formData: FormData) {
	const teamId = formData.get("teamId") as string

	if (!teamId?.trim()) {
		return { error: "Team ID is required" }
	}

	try {
		const user = await stackServerApp.getUser({ or: "redirect" })
		if (!user) {
			return { error: "User not found" }
		}

		// Check if user has access to this team by checking if they're a member
		const userTeams = await user.listTeams()
		const team = userTeams.find((userTeam) => userTeam.id === teamId)
		if (!team) {
			return { error: "You don't have access to delete this team" }
		}

		// If this was the selected team, ensure user has another team selected
		if (user.selectedTeam?.id === teamId) {
			return { error: "You cannot delete your selected team" }
		}

		await team.delete()

		revalidatePath("/", "layout")

		return { success: true }
	} catch (error) {
		console.error("Failed to delete team:", error)
		return { error: "Failed to delete team" }
	}
}

export async function selectTeam(formData: FormData) {
	const teamId = formData.get("teamId") as string

	if (!teamId?.trim()) {
		throw new Error("Team ID is required")
	}

	try {
		const user = await stackServerApp.getUser({ or: "redirect" })
		if (!user) {
			throw new Error("User not found")
		}

		// Get the team to verify access
		const team = await user.getTeam(teamId)
		if (!team) {
			throw new Error("Team not found or you don't have access")
		}

		// Set the team as selected
		await user.setSelectedTeam(team)

		// Revalidate layout to update team data
		revalidatePath("/", "layout")

		// Redirect to the selected team's todos
		redirect(`/app/teams/${teamId}/todos`)
	} catch (error) {
		console.error("Failed to select team:", error)
		throw error
	}
}
