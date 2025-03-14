"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Team } from "@stackframe/stack"

export function TeamNameForm({ team }: { team: Team }) {
	const [teamName, setTeamName] = useState(team.displayName || "")

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Team Name</CardTitle>
						<CardDescription>
							This is your team's visible name within Stack. For example, the name of your company
							or department.
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<form className="space-y-4">
					<div className="space-y-2">
						<Input
							id="team-name"
							name="name"
							value={teamName}
							onChange={(e) => setTeamName(e.target.value)}
							placeholder="Enter team name"
							required
						/>
						<p className="text-sm text-muted-foreground">Please use 32 characters at maximum.</p>
					</div>

					<div className="flex justify-end">
						<Button type="submit">Save</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	)
}
