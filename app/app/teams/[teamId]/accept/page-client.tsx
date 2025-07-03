"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Loader2 } from "lucide-react"
import { acceptTeamInvitation } from "@/actions/manage-teams"

interface AcceptInvitationPageClientProps {
	code: string
	teamId: string
}

export function AcceptInvitationPageClient({ code, teamId }: AcceptInvitationPageClientProps) {
	const [status, setStatus] = useState<"loading" | "error">("loading")
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const handleAcceptInvitation = async () => {
			try {
				await acceptTeamInvitation(code, teamId)
				// Server action will handle the redirect, so we don't need to do anything here
			} catch (err) {
				setStatus("error")
				setError(err instanceof Error ? err.message : "An unexpected error occurred")
			}
		}

		handleAcceptInvitation()
	}, [code, teamId])

	if (status === "loading") {
		return (
			<div className="container max-w-md mx-auto py-16 px-4">
				<Card>
					<CardHeader className="text-center">
						<Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
						<CardTitle>Accepting Invitation</CardTitle>
						<CardDescription>Please wait while we process your team invitation...</CardDescription>
					</CardHeader>
				</Card>
			</div>
		)
	}

	if (status === "error") {
		return (
			<div className="container max-w-md mx-auto py-16 px-4">
				<Card>
					<CardHeader className="text-center">
						<AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
						<CardTitle className="text-red-600">Failed to Accept Invitation</CardTitle>
						<CardDescription className="text-center">{error}</CardDescription>
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
