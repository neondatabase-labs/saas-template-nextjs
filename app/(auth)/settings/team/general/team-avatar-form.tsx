"use client"

import { Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Team } from "@stackframe/stack"

export function TeamAvatarForm({ team }: { team: Team }) {
	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Team Avatar</CardTitle>
						<CardDescription>This is your team's avatar.</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex items-center gap-4">
					<div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
						{/* TODO: Add avatar upload */}
						<Users className="h-8 w-8 text-muted-foreground" />
					</div>
					<Button variant="outline">Upload Avatar</Button>
				</div>
				<p className="mt-2 text-sm text-muted-foreground">
					Click on the avatar to upload a custom one from your files.
				</p>
			</CardContent>
		</Card>
	)
}
