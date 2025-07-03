import { stackServerApp } from "@/lib/stack-auth/stack"
import { ensureUserHasTeam } from "@/lib/stack-auth/utils"
import { redirect } from "next/navigation"

export default async function AppPage() {
	const user = await stackServerApp.getUser({ or: "redirect" })
	const selectedTeam = await ensureUserHasTeam(user)
	redirect(`/app/teams/${selectedTeam.id}/todos`)
}
