"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Users } from "lucide-react"
import { useOptimistic, useRef, useState } from "react"
import { useUser } from "@/stack-client"
import Image from "next/image"
import { ImageInput } from "@/components/image-input"
import { StripePlan, type STRIPE_SUB_CACHE } from "@/lib/stripe"
import {
	updatePassword,
	deleteAccount,
	addContactChannel,
	deleteContactChannel,
	makePrimaryContactChannel,
	sendVerificationEmail,
} from "./actions"
import { createCheckoutSession, createBillingPortalSession } from "./user/billing/actions"

const plans = [{ name: "Pro Plan", description: "Advanced features for power users", code: "PRO" }]

export function SettingsPageClient({
	contactChannels: serverContactChannels,
	subscriptionPlan,
	subscriptionData,
}: {
	contactChannels: Array<{
		id: string
		value: string
		type: string
		isPrimary: boolean
		isVerified: boolean
		usedForAuth: boolean
	}>
	subscriptionPlan: StripePlan
	subscriptionData: STRIPE_SUB_CACHE
}) {
	const user = useUser({ or: "redirect" })
	const formRef = useRef<HTMLFormElement>(null)
	const [isPendingVerification, setIsPendingVerification] = useState<string[]>([])
	const [avatarError, setAvatarError] = useState("")
	const [passwordError, setPasswordError] = useState<string | null>(null)
	const [deleteError, setDeleteError] = useState<string | null>(null)

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

	const isActive = subscriptionData.status === "active"
	const isPro = subscriptionPlan === "PRO" && isActive

	return (
		<div className="space-y-8">
			{/* Profile Settings */}
			<Card>
				<CardHeader>
					<CardTitle>Profile</CardTitle>
					<CardDescription>
						Manage your personal information and how it appears to others.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						className="space-y-4"
						onSubmit={(event) => {
							event.preventDefault()

							const form = event.target as HTMLFormElement
							const displayName = form.displayName?.value
							user.update({ displayName })
						}}
					>
						<div className="space-y-4">
							<div>
								<label htmlFor="displayName" className="text-sm font-medium">
									Display Name
								</label>
								<Input
									id="displayName"
									name="displayName"
									defaultValue={user.displayName || ""}
									placeholder="Enter your name"
								/>
							</div>
						</div>

						<div className="flex justify-end">
							<Button type="submit">Save Changes</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			{/* Avatar Settings */}
			<Card>
				<CardHeader>
					<CardTitle>Avatar</CardTitle>
					<CardDescription>Your profile picture across all services.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-4">
						<div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
							{user.profileImageUrl ? (
								<Image
									src={user.profileImageUrl}
									alt={user.displayName || "User avatar"}
									className="h-full w-full object-cover"
									width={128}
									height={128}
								/>
							) : (
								<Users className="h-8 w-8 text-muted-foreground" />
							)}
						</div>
						<Button variant="outline" asChild>
							<label className="cursor-pointer">
								Upload Avatar
								<ImageInput
									className="hidden"
									maxBytes={100_000}
									onChange={(dataUrl) => {
										setAvatarError("")
										user.update({ profileImageUrl: dataUrl })
									}}
									onError={(error) => setAvatarError(error)}
								/>
							</label>
						</Button>
					</div>
					<div className="mt-2">
						<p className="text-sm text-destructive min-h-[1rem]">{avatarError}</p>
					</div>
				</CardContent>
			</Card>

			{/* Billing Settings */}
			<Card>
				<CardHeader>
					<CardTitle>Current Plan</CardTitle>
					<CardDescription>Manage your subscription and billing details.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Free Plan */}
					<div className="flex items-center justify-between">
						<div>
							<h3 className="font-medium">
								Free Plan
								{subscriptionPlan === "FREE" && " (Current)"}
							</h3>
							<p className="text-sm text-muted-foreground">Basic features for personal use</p>
						</div>
					</div>

					{/* Paid Plans */}
					{plans.map((plan) => (
						<div key={plan.code} className="flex items-center justify-between">
							<div>
								<h3 className="font-medium">
									{plan.name}
									{subscriptionPlan === plan.code && " (Current"}
									{subscriptionPlan === plan.code &&
										isActive &&
										subscriptionData.cancelAtPeriodEnd &&
										` - Cancels on ${new Date(subscriptionData.currentPeriodEnd * 1000).toLocaleDateString()}`}
									{subscriptionPlan === plan.code && ")"}
								</h3>
								<p className="text-sm text-muted-foreground">{plan.description}</p>
							</div>

							{subscriptionPlan === plan.code && isActive ? (
								<form action={createBillingPortalSession}>
									<Button type="submit" variant="outline">
										Manage Subscription
									</Button>
								</form>
							) : (
								<form action={createCheckoutSession}>
									<Button type="submit" variant="outline">
										Upgrade
									</Button>
								</form>
							)}
						</div>
					))}

					<div className="border-t pt-4 mt-4">
						<h4 className="text-sm font-medium mb-2">Plan Features</h4>
						<ul className="text-sm space-y-1">
							<li className="flex items-center gap-2">
								<span className="text-green-500">✓</span> Unlimited todos
							</li>
							<li className="flex items-center gap-2">
								<span className="text-green-500">✓</span> Basic project management
							</li>
							<li className="flex items-center gap-2">
								<span className={isPro ? "text-green-500" : "text-muted-foreground"}>
									{isPro ? "✓" : "✗"}
								</span>{" "}
								Advanced analytics
							</li>
							<li className="flex items-center gap-2">
								<span className={isPro ? "text-green-500" : "text-muted-foreground"}>
									{isPro ? "✓" : "✗"}
								</span>{" "}
								Priority support
							</li>
						</ul>
					</div>
				</CardContent>
			</Card>

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
											) : isPendingVerification.includes(channel.id) ? (
												<span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
													Verifying...
												</span>
											) : (
												<form
													action={async (formData) => {
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

			{/* Danger Zone */}
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
							setDeleteError(result.success ? null : result.error)
						}}
						className="space-y-4"
					>
						<div className="flex flex-col gap-4">
							<div id="delete-error" aria-live="polite" className="text-sm text-red-500">
								{deleteError}
							</div>
							<div className="flex justify-end">
								<Button type="submit" variant="destructive">
									Delete Account
								</Button>
							</div>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
