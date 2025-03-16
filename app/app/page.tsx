import { redirect } from "next/navigation"

export default function AppPage() {
	// default to todos if user comes to /app
	redirect("/app/todos")
}
