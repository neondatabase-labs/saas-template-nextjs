"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users } from "lucide-react"
import { useUser } from "@/stack-client"
import { useState } from "react"
import { ImageInput } from "@/components/image-input"
import Image from "next/image"

export function GeneralSettingsPageClient() {
	const user = useUser()
	const [avatarError, setAvatarError] = useState("")

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
		</div>
	)
}
