"use server"

import { stackServerApp, getAccessToken } from "@/lib/stack-auth/stack"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { cookies } from "next/headers"

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

		// Check if there are other members with admin permissions
		const members = await team.listUsers()
		const otherAdmins = await Promise.all(
			members
				.filter((member: any) => member.id !== user.id)
				.map(async (member: any) => {
					try {
						const memberUser = await stackServerApp.getUser(member.id)
						if (!memberUser) return false
						const hasDeletePermission = await memberUser.hasPermission(team, "$delete_team")
						return hasDeletePermission
					} catch {
						return false
					}
				}),
		)

		const hasOtherAdmins = otherAdmins.some(Boolean)

		if (hasOtherAdmins) {
			// If there are other admins, just leave the team instead of deleting it
			await user.leaveTeam(team)
			revalidatePath("/", "layout")
			return { success: true, message: "Left team successfully" }
		} else {
			// If no other admins, delete the team
			await team.delete()
			revalidatePath("/", "layout")
			return { success: true, message: "Team deleted successfully" }
		}
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
	} catch (error) {
		console.error("Failed to select team:", error)
		throw error
	}

	// Redirect to the selected team's todos
	redirect(`/app/teams/${teamId}/todos`)
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
		const callbackUrl = `${process.env.NEXT_PUBLIC_ORIGIN}/app/teams/${validTeamId}/accept`
		await team.inviteUser({
			email: validEmail,
			callbackUrl,
		})

		revalidatePath("/", "layout")

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

		revalidatePath("/", "layout")

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

		// Check if user is the only member
		const members = await team.listUsers()
		const isOnlyMember = members.length === 1 && members[0].id === user.id

		if (isOnlyMember) {
			// If user is the only member, delete the team instead of leaving
			await team.delete()
			revalidatePath("/", "layout")
			return { success: true, message: "Team deleted successfully (you were the only member)" }
		} else {
			// Otherwise, just leave the team
			await user.leaveTeam(team)
			revalidatePath("/", "layout")
			return { success: true, message: "You have left the team" }
		}
	} catch (error) {
		console.error("Failed to leave team:", error)
		return { error: "Failed to leave team" }
	}
}

export async function acceptTeamInvitation(code: string, teamId: string) {
	const accessToken = await getAccessToken(await cookies())
	if (!accessToken) {
		throw new Error("No access token found")
	}

	try {
		const response = await fetch(
			`${process.env.STACK_API_URL || "https://api.stack-auth.com"}/api/v1/team-invitations/accept`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Stack-Project-Id": stackServerApp.projectId,
					"X-Stack-Publishable-Client-Key": process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
					"X-Stack-Secret-Server-Key": process.env.STACK_SECRET_SERVER_KEY!,
					"X-Stack-Access-Type": "server",
					"X-Stack-Access-Token": accessToken,
				},
				body: JSON.stringify({ code }),
			},
		)

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}))
			console.error(errorData)
			throw new Error(
				errorData.message ||
					`HTTP ${response.status}: Failed to accept invitation: ${response.statusText}`,
			)
		}
	} catch (error) {
		console.error("Failed to accept team invitation:", error)
		throw error
	}

	revalidatePath("/", "layout")

	// Redirect to the team's todos page after successful acceptance
	redirect(`/app/teams/${teamId}/todos`)
}
