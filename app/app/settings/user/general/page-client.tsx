"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users } from "lucide-react"
import { useUser } from "@/stack-client"

export function GeneralSettingsPageClient() {
	const user = useUser()

	return (
		<div className="space-y-8">
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Profile</CardTitle>
							<CardDescription>
								Manage your personal information and how it appears to others.
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<form
						className="space-y-4"
						onSubmit={(event) => {
							event.preventDefault()

							const form = event.target as HTMLFormElement
							const displayName = form.displayName?.value

							user.setDisplayName(displayName)
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

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Avatar</CardTitle>
							<CardDescription>Your profile picture across all services.</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-4">
						<div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
							{user.profileImageUrl ? (
								<img
									src={user.profileImageUrl}
									alt={user.displayName || "User avatar"}
									className="h-full w-full object-cover"
								/>
							) : (
								<Users className="h-8 w-8 text-muted-foreground" />
							)}
						</div>
						<Button variant="outline">Upload Avatar</Button>
					</div>
					<p className="mt-2 text-sm text-muted-foreground">
						Click on the avatar to upload a custom one from your files.
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
