import { redirect } from "next/navigation"

export default function SettingsPage() {
	// default to user settings if user comes to /settings
	redirect("/app/settings/user/general")
}
