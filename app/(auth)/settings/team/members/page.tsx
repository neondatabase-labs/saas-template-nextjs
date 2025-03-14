import { stackServerApp } from "@/stack"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"

export default async function TeamMembersSettingsPage() {
	const user = await stackServerApp.getUser({ or: "redirect" })
	const team = user.selectedTeam

	return (
		<div className="space-y-8">
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Team Members</CardTitle>
							<CardDescription>Manage your team members and their roles.</CardDescription>
						</div>
						<Button>
							<UserPlus className="h-4 w-4 mr-2" />
							Invite Member
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<div className="text-sm text-muted-foreground">
						No members yet. Invite your teammates to collaborate.
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
