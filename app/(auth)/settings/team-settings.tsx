"use client"

import { useState } from "react"
import { Plus, Trash2, Users, UserPlus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { Team } from "@stackframe/stack"
import { createTeam, leaveTeam } from "@/lib/actions"

export function TeamSettings({ teams }: { teams: Team[] }) {
	const [isAddTeamOpen, setIsAddTeamOpen] = useState(false)
	const [isInviteMemberOpen, setIsInviteMemberOpen] = useState(false)
	const [teamName, setTeamName] = useState("")
	const [inviteEmail, setInviteEmail] = useState("")
	const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)

	async function handleAddTeam(formData: FormData) {
		const result = await createTeam(formData)

		if (result.success) {
			setTeamName("")
			setIsAddTeamOpen(false)
		}
	}

	async function handleInviteMember(formData: FormData) {
		// TODO: Implement member invitation
		setIsInviteMemberOpen(false)
	}

	async function handleDeleteTeam(team: Team) {
		const formData = new FormData()
		formData.append("teamId", team.id)
		await leaveTeam(formData)
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Teams</CardTitle>
							<CardDescription>
								Manage your teams and their members. Teams help you organize projects and
								collaborate with others.
							</CardDescription>
						</div>
						<Button onClick={() => setIsAddTeamOpen(true)}>
							<Plus className="h-4 w-4 mr-2" />
							New Team
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<div className="divide-y">
						{teams.map((team) => (
							<div key={team.id} className="flex items-center justify-between py-4">
								<div className="flex items-center gap-4">
									<div className="flex flex-col">
										<span className="font-medium">{team.displayName}</span>
										<span className="text-sm text-muted-foreground">
											{/* TODO: Add team stats */}3 members · 2 projects
										</span>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<Button
										variant="ghost"
										size="icon"
										onClick={() => {
											setSelectedTeam(team)
											setIsInviteMemberOpen(true)
										}}
									>
										<UserPlus className="h-4 w-4" />
										<span className="sr-only">Invite member</span>
									</Button>
									<Button variant="ghost" size="icon">
										<Users className="h-4 w-4" />
										<span className="sr-only">View members</span>
									</Button>
									<Button variant="ghost" size="icon" onClick={() => handleDeleteTeam(team)}>
										<Trash2 className="h-4 w-4" />
										<span className="sr-only">Delete team</span>
									</Button>
								</div>
							</div>
						))}

						{teams.length === 0 && (
							<div className="py-4 text-center text-sm text-muted-foreground">
								No teams yet. Create one to start collaborating.
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Add Team Dialog */}
			<Dialog open={isAddTeamOpen} onOpenChange={setIsAddTeamOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create New Team</DialogTitle>
					</DialogHeader>
					<form action={handleAddTeam} className="space-y-4">
						<div className="space-y-2">
							<label htmlFor="team-name" className="text-sm font-medium">
								Team Name
							</label>
							<Input
								id="team-name"
								name="name"
								value={teamName}
								onChange={(e) => setTeamName(e.target.value)}
								placeholder="Enter team name"
								required
							/>
						</div>

						<div className="flex justify-end">
							<Button type="submit">Create Team</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			{/* Invite Member Dialog */}
			<Dialog open={isInviteMemberOpen} onOpenChange={setIsInviteMemberOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Invite Team Member</DialogTitle>
					</DialogHeader>
					<form action={handleInviteMember} className="space-y-4">
						<div className="space-y-2">
							<label htmlFor="invite-email" className="text-sm font-medium">
								Email Address
							</label>
							<Input
								id="invite-email"
								name="email"
								type="email"
								value={inviteEmail}
								onChange={(e) => setInviteEmail(e.target.value)}
								placeholder="Enter email address"
								required
							/>
						</div>

						<input type="hidden" name="teamId" value={selectedTeam?.id} />

						<div className="flex justify-end">
							<Button type="submit">Send Invitation</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	)
}
