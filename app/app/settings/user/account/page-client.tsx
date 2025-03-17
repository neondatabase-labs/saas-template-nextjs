"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle } from "lucide-react"
import { useOptimistic, useRef, useState } from "react"
import { useUser } from "@/stack-client"
import {
	updatePassword,
	deleteAccount,
	addContactChannel,
	deleteContactChannel,
	makePrimaryContactChannel,
	sendVerificationEmail,
} from "./actions"

export function AccountSettingsPageClient({
	contactChannels: serverContactChannels,
}: {
	contactChannels: Array<{
		id: string
		value: string
		type: string
		isPrimary: boolean
		isVerified: boolean
		usedForAuth: boolean
	}>
}) {
	const user = useUser({ or: "redirect" })
	const formRef = useRef<HTMLFormElement>(null)
	const [isPendingVerification, setIsPendingVerification] = useState<string[]>([])
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
						return { ...channel, isPrimary: channel.id === event.id }
					})
			}
		},
	)

	const [passwordError, setPasswordError] = useState<string | null>(null)
	const [deleteError, setDeleteError] = useState<string | null>(null)

	return (
		<div className="space-y-8">
			{/* Email Settings */}
			<Card>
				<CardHeader>
					<CardTitle>Email Address</CardTitle>
					<CardDescription>Update the email address associated with your account.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-6">
						{contactChannels.length > 0 && (
							<div className="space-y-2">
								{contactChannels.map((channel) => (
									<div key={channel.id} className="flex items-center gap-2 text-sm">
										<span>{channel.value}</span>
										{channel.isVerified && (
											<span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
												Verified
											</span>
										)}
										{channel.isPrimary && (
											<span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
												Primary
											</span>
										)}
										<div className="flex grow justify-end">
											{!channel.isPrimary ? (
												<form
													action={async (formData) => {
														sendChannelEvent({ type: "removeEmail", id: channel.id })
														await deleteContactChannel(formData)
													}}
												>
													<input type="hidden" name="id" value={channel.id} />
													<Button type="submit" variant="outline" size="xs">
														Remove
													</Button>
												</form>
											) : null}

											{channel.isVerified ? (
												channel.isPrimary ? (
													!channel.usedForAuth && user.hasPassword ? (
														// generally we won't see this, because we set primary at the same time as usedForAuth
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
														<>{/* // no action for primary verified email */}</>
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
											) : isPendingVerification.includes(channel.id) ? (
												<span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
													Verifying...
												</span>
											) : (
												<form
													action={async (formData) => {
														// TODO: React wraps this in startTransition which makes it slow
														setIsPendingVerification([...isPendingVerification, channel.id])
														await sendVerificationEmail(formData)
													}}
												>
													<input type="hidden" name="id" value={channel.id} />
													<Button type="submit" variant="outline" size="xs">
														Send verification email
													</Button>
												</form>
											)}
										</div>
									</div>
								))}
							</div>
						)}

						<form
							ref={formRef}
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
				</CardContent>
			</Card>

			{/* Password Settings */}
			<Card>
				<CardHeader>
					<CardTitle>{user.hasPassword ? "Change Password" : "Set Up Password"}</CardTitle>
					<CardDescription>
						{user.hasPassword
							? "Update your account password."
							: "Add a password to enable password-based login as an alternative to your current sign-in method."}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						action={async (formData) => {
							const result = await updatePassword(formData)
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
								<Input
									id="new-password"
									name="newPassword"
									type="password"
									placeholder="Enter new password"
									onBlur={() => setPasswordError(null)}
								/>
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
				</CardContent>
			</Card>

			<Card className="border-red-200">
				<CardHeader>
					<div className="flex items-center gap-2">
						<AlertTriangle className="h-5 w-5 text-red-500" />
						<CardTitle className="text-red-500">Danger Zone</CardTitle>
					</div>
					<CardDescription>
						Permanently delete your account and all associated data.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						action={async (formData) => {
							const result = await deleteAccount(formData)
							if (result?.error) {
								setDeleteError(result.error)
							}
						}}
						className="space-y-4"
					>
						<p className="text-sm">
							Once you delete your account, there is no going back. This action cannot be undone.
							All your data will be permanently deleted.
						</p>

						<div className="grid gap-2">
							<Label htmlFor="confirm-delete">Type DELETE to confirm</Label>
							<Input
								id="confirm-delete"
								name="confirmDelete"
								placeholder="DELETE"
								onFocus={() => setDeleteError(null)}
							/>
							{deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
						</div>

						<div className="flex justify-end">
							<Button type="submit" variant="destructive">
								Delete Account
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
