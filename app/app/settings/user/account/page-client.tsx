"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle } from "lucide-react"
import { updateEmail, updatePassword, deleteAccount } from "./actions"
import { useStackApp } from "@stackframe/stack"

export function AccountSettingsPageClient() {
	const stack = useStackApp()
	const user = stack.useUser({ or: "redirect" })

	return (
		<div className="space-y-8">
			{/* Email Settings */}
			<Card>
				<CardHeader>
					<CardTitle>Email Address</CardTitle>
					<CardDescription>Update the email address associated with your account.</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={updateEmail} className="space-y-4">
						<div className="grid gap-4">
							<div className="grid gap-2">
								<Label htmlFor="current-email">Current Email</Label>
								<Input
									id="current-email"
									value={user.primaryEmail || ""}
									disabled
									className="bg-muted"
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="new-email">New Email</Label>
								<Input
									id="new-email"
									name="newEmail"
									type="email"
									placeholder="Enter new email address"
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="password-confirm">Password</Label>
								<Input
									id="password-confirm"
									name="password"
									type="password"
									placeholder="Confirm with your password"
								/>
								<p className="text-xs text-muted-foreground">
									For security, please enter your current password to confirm this change.
								</p>
							</div>
						</div>

						<div className="flex justify-end">
							<Button type="submit">Update Email</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			{/* Password Settings */}
			<Card>
				<CardHeader>
					<CardTitle>Change Password</CardTitle>
					<CardDescription>Update your account password.</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={updatePassword} className="space-y-4">
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
								<p className="text-xs text-muted-foreground">
									Password must be at least 8 characters and include a number and a special
									character.
								</p>
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
							<Button type="submit">Update Password</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			{/* Account Security */}
			<Card>
				<CardHeader>
					<CardTitle>Two-Factor Authentication</CardTitle>
					<CardDescription>Add an extra layer of security to your account.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between">
						<div>
							<h3 className="font-medium">Two-Factor Authentication</h3>
							<p className="text-sm text-muted-foreground">
								Protect your account with an additional verification step.
							</p>
						</div>
						<Button variant="outline">Enable 2FA</Button>
					</div>
				</CardContent>
			</Card>

			{/* Account Sessions */}
			<Card>
				<CardHeader>
					<CardTitle>Active Sessions</CardTitle>
					<CardDescription>Manage your active login sessions.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="font-medium">Current Device</h3>
								<p className="text-sm text-muted-foreground">
									{new Date().toLocaleDateString()} · Current Browser
								</p>
							</div>
							<span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
								Current
							</span>
						</div>
						<div className="flex justify-end">
							<Button variant="outline">Sign Out All Other Devices</Button>
						</div>
					</div>
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
					<form action={deleteAccount} className="space-y-4">
						<p className="text-sm">
							Once you delete your account, there is no going back. This action cannot be undone.
							All your data will be permanently deleted.
						</p>

						<div className="grid gap-2">
							<Label htmlFor="confirm-delete">Type DELETE to confirm</Label>
							<Input id="confirm-delete" name="confirmDelete" placeholder="DELETE" />
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
