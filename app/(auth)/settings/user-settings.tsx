"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"

export function UserSettings({ user }: { user: any }) {
	const [isUpdating, setIsUpdating] = useState(false)

	async function handleUpdateProfile(formData: FormData) {
		setIsUpdating(true)
		try {
			// TODO: Implement profile update
		} catch (error) {
			console.error("Failed to update profile:", error)
		} finally {
			setIsUpdating(false)
		}
	}

	async function handleUpdatePassword(formData: FormData) {
		setIsUpdating(true)
		try {
			// TODO: Implement password update
		} catch (error) {
			console.error("Failed to update password:", error)
		} finally {
			setIsUpdating(false)
		}
	}

	return (
		<div className="space-y-6">
			{/* Profile Settings */}
			<Card>
				<CardHeader>
					<CardTitle>Profile</CardTitle>
					<CardDescription>Update your personal information.</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={handleUpdateProfile} className="space-y-4">
						<div className="flex items-center gap-4">
							{user?.raw_json.profile_image_url && (
								<Image
									src={user.raw_json.profile_image_url}
									alt="Profile"
									width={64}
									height={64}
									className="rounded-full"
								/>
							)}
							<Button variant="outline" type="button" disabled>
								Change Avatar
							</Button>
						</div>

						<div className="grid gap-4">
							<div className="grid gap-2">
								<Label htmlFor="display-name">Display Name</Label>
								<Input
									id="display-name"
									name="displayName"
									defaultValue={user?.name}
									placeholder="Your name"
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									name="email"
									type="email"
									defaultValue={user?.email}
									placeholder="Your email"
									disabled
								/>
								<p className="text-sm text-muted-foreground">
									Email changes are managed through your Stack Auth account.
								</p>
							</div>
						</div>

						<div className="flex justify-end">
							<Button type="submit" disabled={isUpdating}>
								Save Changes
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			{/* Password Settings */}
			<Card>
				<CardHeader>
					<CardTitle>Password</CardTitle>
					<CardDescription>Change your password.</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={handleUpdatePassword} className="space-y-4">
						<div className="grid gap-4">
							<div className="grid gap-2">
								<Label htmlFor="current-password">Current Password</Label>
								<Input
									id="current-password"
									name="currentPassword"
									type="password"
									placeholder="Enter current password"
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="new-password">New Password</Label>
								<Input
									id="new-password"
									name="newPassword"
									type="password"
									placeholder="Enter new password"
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="confirm-password">Confirm New Password</Label>
								<Input
									id="confirm-password"
									name="confirmPassword"
									type="password"
									placeholder="Confirm new password"
								/>
							</div>
						</div>

						<div className="flex justify-end">
							<Button type="submit" disabled={isUpdating}>
								Update Password
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			{/* Notification Settings */}
			<Card>
				<CardHeader>
					<CardTitle>Notifications</CardTitle>
					<CardDescription>Configure how you receive notifications.</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						Notification settings coming soon. You'll be able to customize email notifications for
						tasks, mentions, and team updates.
					</p>
				</CardContent>
			</Card>

			{/* Danger Zone */}
			<Card>
				<CardHeader>
					<CardTitle className="text-red-600">Danger Zone</CardTitle>
					<CardDescription>
						Permanently delete your account and all associated data.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button variant="destructive" type="button" disabled>
						Delete Account
					</Button>
					<p className="mt-2 text-sm text-muted-foreground">
						Account deletion is managed through your Stack Auth account.
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
