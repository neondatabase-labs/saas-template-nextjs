"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Users, Plus, Loader2, X, UserMinus } from "lucide-react"
import { useEffect, useState } from "react"
import {
	inviteUserToTeam,
	getTeamMembers,
	removeUserFromTeam,
	leaveTeam,
} from "@/actions/manage-teams"
import { toast } from "sonner"
import { useRequiredUser } from "@/lib/stack-auth/stack-client"
import {
	AlertDialog,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
} from "@/components/ui/alert-dialog"

interface TeamMember {
	id: string
	displayName: string | null
	primaryEmail: string | null
	profileImageUrl: string | null
}

interface TeamManagementModalProps {
	team: {
		id: string
		displayName: string
		profileImageUrl: string | null
	}
	children: React.ReactNode
}

export function TeamManagementModal({ team, children }: TeamManagementModalProps) {
	const currentUser = useRequiredUser()
	const [isOpen, setIsOpen] = useState(false)
	const [members, setMembers] = useState<TeamMember[]>([])
	const [loading, setLoading] = useState(false)
	const [inviting, setInviting] = useState(false)
	const [removing, setRemoving] = useState<string | null>(null)
	const [email, setEmail] = useState("")

	const loadMembers = async () => {
		setLoading(true)
		try {
			const result = await getTeamMembers(team.id)
			if (result.success) {
				setMembers(result.members)
			} else {
				toast.error(result.error)
			}
		} catch (error) {
			toast.error("Failed to load team members")
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (isOpen) {
			loadMembers()
		}
	}, [isOpen, team.id])

	const handleInvite = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!email.trim()) return

		setInviting(true)
		try {
			const formData = new FormData()
			formData.append("teamId", team.id)
			formData.append("email", email.trim())

			const result = await inviteUserToTeam(formData)
			if (result.success) {
				toast.success(result.message)
				setEmail("")
			} else {
				toast.error(result.error)
			}
		} catch (error) {
			toast.error("Failed to send invitation")
		} finally {
			setInviting(false)
		}
	}

	const handleRemoveUser = async (userId: string, displayName: string) => {
		setRemoving(userId)
		try {
			const formData = new FormData()
			formData.append("teamId", team.id)
			formData.append("userId", userId)

			const result = await removeUserFromTeam(formData)
			if (result.success) {
				toast.success(result.message)
				loadMembers()
			} else {
				toast.error(result.error)
			}
		} catch (error) {
			toast.error("Failed to remove user")
		} finally {
			setRemoving(null)
		}
	}

	const handleLeaveTeam = async () => {
		setRemoving(currentUser.id)
		try {
			const formData = new FormData()
			formData.append("teamId", team.id)

			const result = await leaveTeam(formData)
			if (result.success) {
				toast.success(result.message)
				setIsOpen(false)
				// The page will refresh due to revalidatePath
			} else {
				toast.error(result.error)
			}
		} catch (error) {
			toast.error("Failed to leave team")
		} finally {
			setRemoving(null)
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Users className="h-5 w-5" />
						Manage Team: {team.displayName}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					{/* Team Members */}
					<div>
						<h3 className="font-medium mb-3">Team Members</h3>
						{loading ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="h-6 w-6 animate-spin" />
							</div>
						) : members.length === 0 ? (
							<p className="text-sm text-muted-foreground py-4">No members found.</p>
						) : (
							<div className="space-y-3 max-h-64 overflow-y-auto">
								{members.map((member) => {
									const isCurrentUser = member.id === currentUser.id
									const isRemoving = removing === member.id

									return (
										<div key={member.id} className="flex items-center gap-3 p-3 border rounded-lg">
											<Avatar className="h-8 w-8">
												<AvatarImage src={member.profileImageUrl || ""} />
												<AvatarFallback>
													{member.displayName?.[0] || member.primaryEmail?.[0] || "U"}
												</AvatarFallback>
											</Avatar>
											<div className="flex-1 min-w-0">
												<p className="font-medium truncate">
													{member.displayName || "Unknown User"}
													{isCurrentUser && (
														<span className="text-sm text-muted-foreground ml-2">(You)</span>
													)}
												</p>
												<p className="text-sm text-muted-foreground truncate">
													{member.primaryEmail || "No email"}
												</p>
											</div>
											<div className="flex gap-2">
												{isCurrentUser ? (
													<AlertDialog>
														<AlertDialogTrigger asChild>
															<Button
																variant="ghost"
																size="sm"
																className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
																disabled={isRemoving}
															>
																{isRemoving ? (
																	<Loader2 className="h-4 w-4 animate-spin" />
																) : (
																	<UserMinus className="h-4 w-4" />
																)}
															</Button>
														</AlertDialogTrigger>
														<AlertDialogContent>
															<AlertDialogHeader>
																<AlertDialogTitle>Leave Team</AlertDialogTitle>
																<AlertDialogDescription>
																	Are you sure you want to leave "{team.displayName}"? You will lose
																	access to all team resources.
																</AlertDialogDescription>
															</AlertDialogHeader>
															<AlertDialogFooter>
																<AlertDialogCancel>Cancel</AlertDialogCancel>
																<Button
																	variant="destructive"
																	onClick={handleLeaveTeam}
																	disabled={isRemoving}
																>
																	{isRemoving ? (
																		<>
																			<Loader2 className="h-4 w-4 mr-2 animate-spin" />
																			Leaving...
																		</>
																	) : (
																		"Leave Team"
																	)}
																</Button>
															</AlertDialogFooter>
														</AlertDialogContent>
													</AlertDialog>
												) : (
													<AlertDialog>
														<AlertDialogTrigger asChild>
															<Button
																variant="ghost"
																size="sm"
																className="text-red-600 hover:text-red-700 hover:bg-red-50"
																disabled={isRemoving}
															>
																{isRemoving ? (
																	<Loader2 className="h-4 w-4 animate-spin" />
																) : (
																	<X className="h-4 w-4" />
																)}
															</Button>
														</AlertDialogTrigger>
														<AlertDialogContent>
															<AlertDialogHeader>
																<AlertDialogTitle>Remove User</AlertDialogTitle>
																<AlertDialogDescription>
																	Are you sure you want to remove "
																	{member.displayName || member.primaryEmail}" from "
																	{team.displayName}"? They will lose access to all team resources.
																</AlertDialogDescription>
															</AlertDialogHeader>
															<AlertDialogFooter>
																<AlertDialogCancel>Cancel</AlertDialogCancel>
																<Button
																	variant="destructive"
																	onClick={() =>
																		handleRemoveUser(
																			member.id,
																			member.displayName || member.primaryEmail || "Unknown User",
																		)
																	}
																	disabled={isRemoving}
																>
																	{isRemoving ? (
																		<>
																			<Loader2 className="h-4 w-4 mr-2 animate-spin" />
																			Removing...
																		</>
																	) : (
																		"Remove User"
																	)}
																</Button>
															</AlertDialogFooter>
														</AlertDialogContent>
													</AlertDialog>
												)}
											</div>
										</div>
									)
								})}
							</div>
						)}
					</div>

					{/* Invite User */}
					<div>
						<h3 className="font-medium mb-3">Invite New Member</h3>
						<form onSubmit={handleInvite} className="space-y-4">
							<div className="space-y-4">
								<Label htmlFor="invite-email">Email Address</Label>
								<Input
									id="invite-email"
									type="email"
									placeholder="Enter email address"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									disabled={inviting}
								/>
							</div>
							<Button type="submit" disabled={inviting || !email.trim()} className="w-full">
								{inviting ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Sending Invitation...
									</>
								) : (
									<>
										<Plus className="h-4 w-4 mr-2" />
										Send Invitation
									</>
								)}
							</Button>
						</form>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
