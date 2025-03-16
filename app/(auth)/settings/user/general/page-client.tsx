"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users } from "lucide-react"
import { useStackApp } from "@stackframe/stack"

export function GeneralSettingsPageClient() {
	const stack = useStackApp()
	const user = stack.useUser({ or: "redirect" })

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
					<form className="space-y-4">
						<div className="space-y-4">
							<div>
								<label htmlFor="name" className="text-sm font-medium">
									Display Name
								</label>
								<Input
									id="name"
									name="name"
									defaultValue={user.displayName || ""}
									placeholder="Enter your name"
									required
								/>
							</div>

							<div>
								<label htmlFor="email" className="text-sm font-medium">
									Email
								</label>
								<Input
									id="email"
									name="email"
									type="email"
									defaultValue={user.primaryEmail || ""}
									placeholder="Enter your email"
									required
									disabled
								/>
								<p className="mt-1 text-sm text-muted-foreground">
									Your email is used for important notifications and can't be changed here.
								</p>
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
