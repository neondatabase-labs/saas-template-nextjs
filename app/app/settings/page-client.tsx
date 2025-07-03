"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	AlertTriangle,
	Users,
	Zap,
	Package,
	Mail,
	Shield,
	Eye,
	EyeOff,
	Trash2,
	TrashIcon,
} from "lucide-react"
import { startTransition, useOptimistic, useRef, useState } from "react"
import { useRequiredUser } from "@/lib/stack-auth/stack-client"
import Image from "next/image"
import { ImageInput } from "@/components/image-input"
import {
	updatePassword,
	deleteAccount,
	addContactChannel,
	deleteContactChannel,
	makePrimaryContactChannel,
	sendVerificationEmail,
	createCheckoutSession,
	createBillingPortalSession,
} from "./actions"
import { deleteTeam } from "@/actions/manage-teams"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
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
import { cn } from "@/lib/utils"
import { Card, CardTitle, CardHeader, CardDescription, CardFooter } from "@/components/ui/card"
import { SubscriptionPlan } from "@/lib/stripe/plans"
import { TeamManagementModal } from "./team-management-modal"
import { toast } from "sonner"

export function SettingsPageClient({
	contactChannels: serverContactChannels,
	planId,
	todoMetrics,
	plans,
	teams: serverTeams,
}: {
	contactChannels: Array<{
		id: string
		value: string
		type: string
		isPrimary: boolean
		isVerified: boolean
		usedForAuth: boolean
	}>
	planId: string
	todoMetrics: {
		todosCreated: number
		todoLimit: number
		remaining: number
		subscription: string
	} | null
	plans: SubscriptionPlan[]
	teams: Array<{
		id: string
		displayName: string
		profileImageUrl: string | null
		isSelected: boolean
	}>
}) {
	const user = useRequiredUser()
	const formRef = useRef<HTMLFormElement>(null)
	const [profileError, setProfileError] = useState("")
	const [passwordError, setPasswordError] = useState<string | null>(null)
	const [deleteError, setDeleteError] = useState<string | null>(null)
	const [teamError, setTeamError] = useState<string | null>(null)
	const [showNewPassword, setShowNewPassword] = useState(false)
	const [pendingVerificationId, setPendingVerificationId] = useState<string | null>(null)

	const [contactChannels, sendChannelEvent] = useOptimistic(
		serverContactChannels,
		(
			current,
			event:
				| { type: "addEmail"; email: string }
				| { type: "removeEmail"; id: string }
				| { type: "makePrimary"; id: string },
		) => {
			switch (event.type) {
				case "addEmail":
					return [
						...current,
						{
							id: crypto.randomUUID(),
							value: event.email,
							type: "email",
							isPrimary: false,
							isVerified: false,
							usedForAuth: false,
						},
					]
				case "removeEmail":
					return current.filter((channel) => channel.id !== event.id)
				case "makePrimary":
					return current.map((channel) => {
						return {
							...channel,
							isPrimary: channel.id === event.id,
							usedForAuth: channel.id === event.id,
						}
					})
			}
		},
	)

	const [teams, sendTeamEvent] = useOptimistic(
		serverTeams,
		(
			current,
			event:
				| { type: "deleteTeam"; id: string }
				| { type: "restoreTeam"; team: (typeof serverTeams)[0] },
		) => {
			if (event.type === "deleteTeam") {
				return current.filter((team) => team.id !== event.id)
			}
			if (event.type === "restoreTeam") {
				return [...current, event.team]
			}
			return current
		},
	)

	const isPro = planId === "PRO"
	return (
		<div>
			{/* Profile Settings */}
			<section className="relative flex items-center gap-4">
				<div>
					<label className="cursor-pointer">
						<div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-background bg-muted flex items-center justify-center">
							{user.profileImageUrl ? (
								<Image
									src={user.profileImageUrl}
									alt={user.displayName || "User avatar"}
									className="object-cover"
									fill
								/>
							) : (
								<Users className="h-12 w-12 text-muted-foreground" />
							)}
						</div>
						<ImageInput
							className="hidden"
							maxBytes={100_000}
							onChange={(dataUrl) => {
								setProfileError("")
								user.update({ profileImageUrl: dataUrl })
							}}
							onError={(error) => setProfileError(error)}
						/>
					</label>
				</div>

				<form
					onSubmit={(event) => {
						event.preventDefault()

						const form = event.target as HTMLFormElement
						const displayName = form.displayName?.value
						if (!displayName) {
							// Backend supports users without display names, can choose to block them here
							setProfileError("Display name is required")
							return
						}

						user.update({ displayName })
					}}
				>
					<div className="flex gap-2 items-end max-w-md">
						<div className="grow">
							<Label htmlFor="displayName" className="text-sm">
								Display Name
							</Label>
							<Input
								id="displayName"
								name="displayName"
								defaultValue={user.displayName || ""}
								placeholder="Enter your name"
								className="mt-1"
								onBlur={() => setProfileError("")}
							/>
						</div>
						<div className="flex justify-end">
							<Button type="submit">Save</Button>
						</div>
					</div>
					<div className="mt-1">
						<p className="text-sm text-destructive min-h-[20px]">{profileError}</p>
					</div>
				</form>
			</section>

			{/* Billing Settings */}
			<div className="grid grid-cols-3 gap-6 mt-8">
				<div className={cn(!isPro ? "col-span-2" : "rounded-lg border px-4 py-3 -my-3")}>
					<div className="flex items-center gap-2">
						<h2 className="text-xl font-medium">Free Plan</h2>
					</div>
					<p className="text-sm text-muted-foreground">
						Basic features with up to {plans.find((p) => p.id === "FREE")?.todoLimit ?? 10} todos
					</p>

					{!isPro ? (
						<div className="space-y-4 mt-4">
							<div className="space-y-2">
								<div className="flex items-center justify-between text-sm">
									<span>Todos</span>
									<span className="font-medium">
										{todoMetrics
											? `${todoMetrics.todosCreated} / ${todoMetrics.todoLimit}`
											: "Loading..."}
									</span>
								</div>
								<Progress
									value={todoMetrics ? (todoMetrics.todosCreated / todoMetrics.todoLimit) * 100 : 0}
									className="h-2"
								/>
							</div>
						</div>
					) : (
						<ul className="grid gap-2 text-sm mt-4">
							<li className="flex items-center gap-2">
								<Zap className="h-4 w-4 text-primary" />
								<span>Up to {plans.find((p) => p.id === "FREE")?.todoLimit} todos</span>
							</li>
							<li className="flex items-center gap-2">
								<Package className="h-4 w-4 text-primary" />
								<span>Basic project management</span>
							</li>
						</ul>
					)}
				</div>

				<div className={cn(isPro ? "col-span-2" : "rounded-lg border px-4 py-3 -my-3")}>
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<h2 className="text-xl font-medium">Pro Plan</h2>
							{isPro ? <Badge>Active</Badge> : null}
						</div>
						<p className="text-sm text-muted-foreground">Advanced features for power users</p>
					</div>

					{isPro ? (
						<div className="space-y-4 mt-4">
							<div className="space-y-2">
								<div className="flex items-center justify-between text-sm">
									<span>Todos</span>
									<span className="font-medium">
										{todoMetrics
											? `${todoMetrics.todosCreated} / ${todoMetrics.todoLimit}`
											: "Loading..."}
									</span>
								</div>
								<Progress
									value={
										todoMetrics?.todoLimit
											? (todoMetrics.todosCreated / todoMetrics.todoLimit) * 100
											: 0
									}
									className="h-2"
								/>
							</div>
						</div>
					) : (
						<ul className="grid gap-2 text-sm mt-4">
							<li className="flex items-center gap-2">
								<Zap className="h-4 w-4 text-primary" />
								<span>Unlimited todos</span>
							</li>
							<li className="flex items-center gap-2">
								<Package className="h-4 w-4 text-primary" />
								<span>Basic project management</span>
							</li>
						</ul>
					)}

					<div className="mt-8 flex justify-end">
						{isPro ? (
							<form action={createBillingPortalSession}>
								<Button type="submit" className="gap-2">
									Manage Subscription
								</Button>
							</form>
						) : (
							<form action={createCheckoutSession}>
								<Button type="submit" className="gap-2">
									Upgrade to Pro
								</Button>
							</form>
						)}
					</div>
				</div>
			</div>

			<Separator className="my-8" />

			{/* Email Settings */}
			<div className="mt-8">
				<h2 className="text-lg font-medium flex items-center gap-2">
					<Mail className="h-5 w-5" />
					Email Addresses
				</h2>
				<p className="text-sm text-muted-foreground mt-1">
					Manage the email addresses associated with your account.
				</p>

				<div className="mt-4 space-y-4  max-w-md">
					{contactChannels.map((channel) => (
						<div key={channel.id}>
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
								<div className="flex items-center gap-2">
									<span className="font-medium">{channel.value}</span>
									{!channel.isVerified && (
										<Badge
											variant="outline"
											className="bg-amber-50 text-amber-700 border-amber-200"
										>
											Unverified
										</Badge>
									)}
									{channel.isPrimary && <Badge variant="secondary">Primary</Badge>}
								</div>
								<div className="flex items-center gap-2">
									{channel.isVerified ? (
										channel.isPrimary ? (
											!channel.usedForAuth && user.hasPassword ? (
												<form
													action={async (formData) => {
														sendChannelEvent({ type: "makePrimary", id: channel.id })
														await makePrimaryContactChannel(formData)
													}}
												>
													<input type="hidden" name="id" value={channel.id} />
													<Button type="submit" variant="outline" size="xs">
														Use for Auth
													</Button>
												</form>
											) : (
												<>{/* no action for primary verified email */}</>
											)
										) : (
											<form
												action={async (formData) => {
													sendChannelEvent({ type: "makePrimary", id: channel.id })
													await makePrimaryContactChannel(formData)
												}}
											>
												<input type="hidden" name="id" value={channel.id} />
												<Button type="submit" variant="outline" size="xs">
													Make Primary
												</Button>
											</form>
										)
									) : (
										<form
											onSubmit={(e) => {
												e.preventDefault()
												const formData = new FormData(e.currentTarget)
												setPendingVerificationId(channel.id)
												startTransition(() => {
													sendVerificationEmail(formData)
												})
											}}
										>
											<input type="hidden" name="id" value={channel.id} />
											<Button
												type="submit"
												variant="outline"
												size="sm"
												disabled={pendingVerificationId === channel.id}
											>
												{pendingVerificationId === channel.id ? "Check your email" : "Verify"}
											</Button>
										</form>
									)}
									{!channel.isPrimary && (
										<form action={deleteContactChannel}>
											<input type="hidden" name="id" value={channel.id} />
											<Button variant="ghost" size="sm" type="submit">
												<TrashIcon className="h-4 w-4" />
												<span className="sr-only">Remove</span>
											</Button>
										</form>
									)}
								</div>
							</div>
						</div>
					))}

					<form
						action={async (formData) => {
							sendChannelEvent({ type: "addEmail", email: formData.get("email") as string })
							formRef.current?.reset()
							await addContactChannel(formData)
						}}
						className="space-y-4"
					>
						<div className="flex gap-2">
							<Input name="email" type="email" placeholder="Add another email address" />
							<Button type="submit">Add</Button>
						</div>
					</form>
				</div>
			</div>

			<Separator className="my-8" />

			{/* Password Settings */}
			<div>
				<h2 className="text-lg font-medium flex items-center gap-2">
					<Shield className="h-5 w-5" />
					Password
				</h2>
				<p className="text-sm text-muted-foreground mt-1">
					Update your password to keep your account secure.
				</p>

				<div className="mt-6 space-y-4 max-w-md">
					<form
						action={async (formData) => {
							const result = await updatePassword(formData)
							// todo: replace with useActionState
							setPasswordError(result.success ? null : result.error)
						}}
						className="space-y-4"
					>
						<div className="grid gap-4">
							{user.hasPassword ? (
								<div className="grid gap-2">
									<Label htmlFor="current-password">Current Password</Label>
									<Input
										id="current-password"
										name="currentPassword"
										type="password"
										placeholder="Enter current password"
										onBlur={() => setPasswordError(null)}
									/>
								</div>
							) : null}

							<div className="grid gap-2">
								<Label htmlFor="new-password">New Password</Label>
								<div className="relative">
									<Input
										id="new-password"
										name="newPassword"
										type={showNewPassword ? "text" : "password"}
										placeholder="Enter new password"
										onBlur={() => setPasswordError(null)}
									/>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="absolute right-0 top-0 h-full"
										onClick={() => setShowNewPassword(!showNewPassword)}
									>
										{showNewPassword ? (
											<EyeOff className="h-4 w-4 text-muted-foreground" />
										) : (
											<Eye className="h-4 w-4 text-muted-foreground" />
										)}
										<span className="sr-only">
											{showNewPassword ? "Hide password" : "Show password"}
										</span>
									</Button>
								</div>
							</div>
						</div>

						<div className="flex flex-col gap-4">
							<div id="password-error" aria-live="polite" className="text-sm text-red-500">
								{passwordError}
							</div>
							<div className="flex justify-end">
								<Button type="submit">
									{user.hasPassword ? "Update Password" : "Set Password"}
								</Button>
							</div>
						</div>
					</form>
				</div>
			</div>

			<Separator className="my-8" />

			{/* Teams Management */}
			<div>
				<h2 className="text-lg font-medium flex items-center gap-2">
					<Users className="h-5 w-5" />
					Teams
				</h2>
				<p className="text-sm text-muted-foreground mt-1">
					Manage your teams. You can delete teams that you have access to.
				</p>

				{teamError && (
					<div className="mt-4 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md flex items-center justify-between">
						<span>{teamError}</span>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setTeamError(null)}
							className="h-auto p-1 text-destructive hover:bg-destructive/20"
						>
							<span className="sr-only">Dismiss error</span>×
						</Button>
					</div>
				)}

				<div className="mt-6 space-y-4">
					{teams.length === 0 ? (
						<p className="text-sm text-muted-foreground">No teams found.</p>
					) : (
						<div className="border rounded-lg">
							<div className="overflow-x-auto">
								<table className="w-full">
									<thead className="border-b bg-muted/50">
										<tr>
											<th className="text-left p-3 font-medium">Team</th>
											<th className="text-left p-3 font-medium">Status</th>
											<th className="text-right p-3 font-medium">Actions</th>
										</tr>
									</thead>
									<tbody>
										{teams.map((team) => (
											<tr key={team.id} className="border-b last:border-0 hover:bg-muted/30">
												<td className="p-3">
													<div className="flex items-center gap-3">
														<div className="relative h-8 w-8 overflow-hidden rounded-full bg-muted flex items-center justify-center">
															{team.profileImageUrl ? (
																<Image
																	src={team.profileImageUrl}
																	alt={team.displayName}
																	className="object-cover"
																	fill
																/>
															) : (
																<Users className="h-4 w-4 text-muted-foreground" />
															)}
														</div>
														<TeamManagementModal team={team}>
															<Button
																variant="ghost"
																className="font-medium hover:underline p-0 h-auto"
															>
																{team.displayName}
															</Button>
														</TeamManagementModal>
													</div>
												</td>
												<td className="p-3">
													{team.isSelected && <Badge variant="secondary">Currently Selected</Badge>}
												</td>
												<td className="p-3 text-right">
													<AlertDialog>
														<AlertDialogTrigger asChild>
															<Button
																variant="ghost"
																size="sm"
																className="text-destructive hover:text-destructive hover:bg-destructive/10"
															>
																<Trash2 className="h-4 w-4" />
																<span className="sr-only">Delete team</span>
															</Button>
														</AlertDialogTrigger>
														<AlertDialogContent>
															<AlertDialogHeader>
																<AlertDialogTitle>Delete Team</AlertDialogTitle>
																<AlertDialogDescription>
																	Are you sure you want to delete &quot;{team.displayName}&quot;?
																	This action cannot be undone and all associated data will be
																	permanently deleted.
																</AlertDialogDescription>
															</AlertDialogHeader>
															<AlertDialogFooter>
																<AlertDialogCancel>Cancel</AlertDialogCancel>
																<form
																	action={async (formData) => {
																		setTeamError(null)
																		sendTeamEvent({ type: "deleteTeam", id: team.id })
																		const result = await deleteTeam(formData)
																		if (result?.error) {
																			// Restore the team if there was an error
																			sendTeamEvent({ type: "restoreTeam", team })
																			setTeamError(result.error)
																		} else if (result?.message) {
																			// Show success message via toast
																			toast.success(result.message)
																		}
																	}}
																>
																	<input type="hidden" name="teamId" value={team.id} />
																	<Button type="submit" variant="destructive">
																		Delete Team
																	</Button>
																</form>
															</AlertDialogFooter>
														</AlertDialogContent>
													</AlertDialog>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</div>
			</div>

			<Separator className="my-6" />

			{/* Danger Zone */}
			<div>
				<h2 className="text-lg font-medium flex items-center gap-2 text-destructive">
					<AlertTriangle className="h-5 w-5" />
					Danger Zone
				</h2>
				<p className="text-sm text-muted-foreground mt-1">
					Permanently delete your account and all associated data.
				</p>

				<div className="mt-6">
					<Card className="flex-row">
						<CardHeader className="grow">
							<CardTitle>Delete Account</CardTitle>
							{isPro ? (
								<CardDescription>
									You must cancel your subscription before you can delete your account.
								</CardDescription>
							) : (
								<CardDescription>
									Once you delete your account, there is no going back. This action cannot be
									undone.
								</CardDescription>
							)}
						</CardHeader>

						{isPro ? null : (
							<CardFooter>
								<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button variant="destructive" size="sm" className="gap-2">
												<Trash2 className="h-4 w-4" />
												Delete Account
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
												{deleteError ? (
													<AlertDialogDescription className="text-destructive">
														{deleteError}
													</AlertDialogDescription>
												) : (
													<AlertDialogDescription>
														This action cannot be undone. This will permanently delete your account
														and remove all your data from our servers.
													</AlertDialogDescription>
												)}
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Cancel</AlertDialogCancel>
												<form
													action={async () => {
														const result = await deleteAccount()
														if (!result.success) {
															setDeleteError(result.error)
														}
													}}
												>
													{/* Don't need to close the modal here because the action will redirect if successful */}
													<Button type="submit">Delete</Button>
												</form>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</div>
							</CardFooter>
						)}
					</Card>
				</div>
			</div>
		</div>
	)
}
