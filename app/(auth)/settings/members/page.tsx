import { stackServerApp } from "@/stack"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"

export default async function MembersSettingsPage() {
	const user = await stackServerApp.getUser({ or: "redirect" })
	const teams = await stackServerApp.listTeams()
	const team = teams[0] // For now, just use the first team

	if (!team) {
		return (
			<div className="text-center py-8 text-muted-foreground">
				No teams found. Create a team to manage members.
			</div>
		)
	}

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
