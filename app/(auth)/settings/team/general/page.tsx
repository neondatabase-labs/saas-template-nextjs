import { stackServerApp } from "@/stack"
import { TeamNameForm } from "./team-name-form"
import { TeamUrlForm } from "./team-url-form"
import { TeamAvatarForm } from "./team-avatar-form"

export default async function TeamGeneralSettingsPage() {
	const user = await stackServerApp.getUser({ or: "redirect" })
	const team = user.selectedTeam

	return (
		<div className="space-y-8">
			<TeamNameForm team={team} />
			<TeamUrlForm team={team} />
			<TeamAvatarForm team={team} />
		</div>
	)
}
