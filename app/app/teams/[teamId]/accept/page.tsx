import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { getAccessToken, stackServerApp } from "@/lib/stack-auth/stack"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

interface AcceptInvitationPageProps {
	params: Promise<{ teamId: string }>
	searchParams: Promise<{ code?: string }>
}

async function acceptTeamInvitation(code: string) {
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

		return await response.json()
	} catch (error) {
		console.error("Failed to accept team invitation:", error)
		throw error
	}
}

export default async function AcceptInvitationPage({
	params,
	searchParams,
}: AcceptInvitationPageProps) {
	const { teamId } = await params
	const { code } = await searchParams

	// If no code is provided, show error
	if (!code) {
		return (
			<div className="container max-w-md mx-auto py-16 px-4">
				<Card>
					<CardHeader className="text-center">
						<AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
						<CardTitle className="text-red-600">Invalid Invitation</CardTitle>
						<CardDescription>
							No invitation code was provided. Please check your invitation link and try again.
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		)
	}

	// Try to accept the invitation
	try {
		await acceptTeamInvitation(code)

		// On success, redirect to the team's todos page
		redirect(`/app/teams/${teamId}/todos`)
	} catch (error) {
		// On error, show error message
		const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"

		return (
			<div className="container max-w-md mx-auto py-16 px-4">
				<Card>
					<CardHeader className="text-center">
						<AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
						<CardTitle className="text-red-600">Failed to Accept Invitation</CardTitle>
						<CardDescription className="text-center">{errorMessage}</CardDescription>
					</CardHeader>
					<CardContent className="text-center">
						<p className="text-sm text-muted-foreground">
							Please contact the team administrator or try the invitation link again.
						</p>
					</CardContent>
				</Card>
			</div>
		)
	}
}
