"use server"

import { stackServerApp } from "@/lib/stack-auth/stack"
import { revalidatePath } from "next/cache"

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
				profileImageUrl: newTeam.profileImageUrl
			}
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
		const team = userTeams.find(userTeam => userTeam.id === teamId)
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