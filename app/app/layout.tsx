import { CustomStackProvider } from "@/stack"
import { AppLayoutClient } from "./layout-client"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	// const user = await stackServerApp.getUser()
	// const app = stackServerApp.urls
	// const userProfile = await getUserDetails(user?.id)

	return (
		<CustomStackProvider>
			<AppLayoutClient>{children}</AppLayoutClient>
		</CustomStackProvider>
	)
}
