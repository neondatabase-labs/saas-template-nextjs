import { stackServerApp } from "@/lib/stack-auth/stack"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { AcceptInvitationPageClient } from "./page-client"

interface AcceptInvitationPageProps {
	params: Promise<{ teamId: string }>
	searchParams: Promise<{ code?: string }>
}

export default async function AcceptInvitationPage({
	params,
	searchParams,
}: AcceptInvitationPageProps) {
	await stackServerApp.getUser({ or: "redirect" })
	const { teamId } = await params
	const { code } = await searchParams

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

	return <AcceptInvitationPageClient code={code} teamId={teamId} />
}
