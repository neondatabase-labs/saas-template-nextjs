"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Team } from "@stackframe/stack"

export function TeamUrlForm({ team }: { team: Team }) {
	const [teamUrl, setTeamUrl] = useState("")

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Team URL</CardTitle>
						<CardDescription>
							This is your team's URL namespace on Stack. Within it, your team can inspect their
							projects, check out any recent activity, or configure settings to their liking.
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<form className="space-y-4">
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<div className="flex-shrink-0 text-muted-foreground">stack.dev/</div>
							<Input
								id="team-url"
								name="url"
								value={teamUrl}
								onChange={(e) => setTeamUrl(e.target.value)}
								placeholder="your-team-url"
								required
							/>
						</div>
						<p className="text-sm text-muted-foreground">Please use 48 characters at maximum.</p>
					</div>

					<div className="flex justify-end">
						<Button type="submit">Save</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	)
}
