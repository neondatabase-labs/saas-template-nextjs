"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/lib/stack-auth/stack-client"
import { useUser as useStackUser } from "@stackframe/stack"
import { ChevronDown, Plus, Users } from "lucide-react"
import { createTeam } from "@/actions/manage-teams"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function TeamSwitcher() {
	const user = useUser({ or: "redirect" }) // Custom user for safe profile data
	const stackUser = useStackUser({ or: "redirect" }) // Stack Auth user for team operations
	const router = useRouter()
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
	const [newTeamName, setNewTeamName] = useState("")
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)

	const teams = stackUser.useTeams()
	const selectedTeam = stackUser.selectedTeam

	async function handleTeamSelect(teamId: string) {
		const team = teams.find((t: any) => t.id === teamId)
		if (team) {
			await stackUser.setSelectedTeam(team)
			router.push(`/app/teams/${teamId}/todos`)
		}
	}

	async function handleCreateTeam(formData: FormData) {
		setError(null)
		
		startTransition(async () => {
			const result = await createTeam(formData)
			
			if (result.error) {
				setError(result.error)
			} else if (result.success && result.team) {
				setNewTeamName("")
				setIsCreateDialogOpen(false)
				// Navigate to the new team
				router.push(`/app/teams/${result.team.id}/todos`)
			}
		})
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="flex items-center gap-2 px-3">
					<Users className="h-4 w-4" />
					<span className="text-sm font-medium">
						{selectedTeam?.displayName || "Select Team"}
					</span>
					<ChevronDown className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-64">
				<div className="px-2 py-1.5 text-xs font-medium text-gray-500">
					Switch Teams
				</div>
				{teams.map((team: any) => (
					<DropdownMenuItem
						key={team.id}
						onClick={() => handleTeamSelect(team.id)}
						className="flex items-center gap-2"
					>
						<Users className="h-4 w-4" />
						<span>{team.displayName}</span>
						{selectedTeam?.id === team.id && (
							<div className="ml-auto h-2 w-2 rounded-full bg-blue-500" />
						)}
					</DropdownMenuItem>
				))}
				<DropdownMenuSeparator />
				<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
					<DialogTrigger asChild>
						<DropdownMenuItem
							onSelect={(e) => {
								e.preventDefault()
								setIsCreateDialogOpen(true)
							}}
							className="flex items-center gap-2"
						>
							<Plus className="h-4 w-4" />
							<span>Create Team</span>
						</DropdownMenuItem>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create New Team</DialogTitle>
							<DialogDescription>
								Create a new team to collaborate with others.
							</DialogDescription>
						</DialogHeader>
						<form action={handleCreateTeam} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="team-name">Team Name</Label>
								<Input
									id="team-name"
									name="teamName"
									placeholder="Enter team name"
									value={newTeamName}
									onChange={(e) => setNewTeamName(e.target.value)}
									required
								/>
							</div>
							{error && (
								<div className="text-sm text-red-600">
									{error}
								</div>
							)}
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsCreateDialogOpen(false)}
									disabled={isPending}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									disabled={isPending || !newTeamName.trim()}
								>
									{isPending ? "Creating..." : "Create Team"}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</DropdownMenuContent>
		</DropdownMenu>
	)
} 