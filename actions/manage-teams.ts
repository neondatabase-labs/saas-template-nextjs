"use server"

import { stackServerApp } from "@/lib/stack-auth/stack"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

export async function createTeam(formData: FormData) {
	const teamName = formData.get("teamName") as string

	if (!teamName?.trim()) {
		return { error: "Team name is required" }
	}

	try {
		const user = await stackServerApp.getUser({ or: "redirect" })

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

const inviteUserSchema = z.object({
	teamId: z.string().min(1, "Team ID is required"),
	email: z.string().email("Please enter a valid email address"),
})

const removeUserSchema = z.object({
	teamId: z.string().min(1, "Team ID is required"),
	userId: z.string().min(1, "User ID is required"),
})

export async function inviteUserToTeam(formData: FormData) {
	const teamId = formData.get("teamId") as string
	const email = formData.get("email") as string

	const validation = inviteUserSchema.safeParse({ teamId, email })
	if (!validation.success) {
		return { error: validation.error.errors[0].message }
	}

	const { teamId: validTeamId, email: validEmail } = validation.data

	try {
		const user = await stackServerApp.getUser({ or: "redirect" })

		// Get the team to verify access
		const team = await user.getTeam(validTeamId)
		if (!team) {
			return { error: "Team not found or you don't have access" }
		}

		// Check if user has permission to invite members
		const hasPermission = await user.hasPermission(team, "$invite_members")
		if (!hasPermission) {
			return { error: "You don't have permission to invite members to this team" }
		}

		// Invite the user to the team
		await team.inviteUser({ email: validEmail })

		revalidatePath("/app/settings")

		return { success: true, message: `Invitation sent to ${validEmail}` }
	} catch (error) {
		console.error("Failed to invite user:", error)
		return { error: "Failed to send invitation" }
	}
}

export async function getTeamMembers(teamId: string) {
	try {
		const user = await stackServerApp.getUser({ or: "redirect" })

		// Get the team to verify access
		const team = await user.getTeam(teamId)
		if (!team) {
			return { error: "Team not found or you don't have access" }
		}

		// Get team members - using the correct method
		const members = await team.listUsers()

		return {
			success: true,
			members: members.map((member: any) => ({
				id: member.id,
				displayName: member.displayName,
				primaryEmail: member.primaryEmail,
				profileImageUrl: member.profileImageUrl,
			})),
		}
	} catch (error) {
		console.error("Failed to get team members:", error)
		return { error: "Failed to get team members" }
	}
}

export async function removeUserFromTeam(formData: FormData) {
	const teamId = formData.get("teamId") as string
	const userId = formData.get("userId") as string

	const validation = removeUserSchema.safeParse({ teamId, userId })
	if (!validation.success) {
		return { error: validation.error.errors[0].message }
	}

	const { teamId: validTeamId, userId: validUserId } = validation.data

	try {
		const user = await stackServerApp.getUser({ or: "redirect" })

		// Get the team to verify access
		const team = await user.getTeam(validTeamId)
		if (!team) {
			return { error: "Team not found or you don't have access" }
		}

		// Check if user has permission to remove members
		const hasPermission = await user.hasPermission(team, "$remove_members")
		if (!hasPermission) {
			return { error: "You don't have permission to remove members from this team" }
		}

		// Remove the user from the team
		await team.removeUser(validUserId)

		revalidatePath("/app/settings")

		return { success: true, message: "User removed from team" }
	} catch (error) {
		console.error("Failed to remove user from team:", error)
		return { error: "Failed to remove user from team" }
	}
}

export async function leaveTeam(formData: FormData) {
	const teamId = formData.get("teamId") as string

	if (!teamId?.trim()) {
		return { error: "Team ID is required" }
	}

	try {
		const user = await stackServerApp.getUser({ or: "redirect" })

		// Get the team to verify access
		const team = await user.getTeam(teamId)
		if (!team) {
			return { error: "Team not found or you don't have access" }
		}

		// Check if this is the user's selected team
		if (user.selectedTeam?.id === teamId) {
			return {
				error:
					"You cannot leave your currently selected team. Please switch to another team first.",
			}
		}

		// Leave the team
		await user.leaveTeam(team)

		revalidatePath("/app/settings")

		return { success: true, message: "You have left the team" }
	} catch (error) {
		console.error("Failed to leave team:", error)
		return { error: "Failed to leave team" }
	}
}
