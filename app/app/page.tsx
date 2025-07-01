import { stackServerApp } from "@/lib/stack-auth/stack"
import { redirect } from "next/navigation"

export default async function AppPage() {
	const user = await stackServerApp.getUser({ or: "redirect" })

	// User is guaranteed to have a selected team (ensured in layout)
	if (!user.selectedTeam) {
		throw new Error("User has no selected team - layout should have ensured this!")
	}

	redirect(`/app/teams/${user.selectedTeam.id}/todos`)
}
