import { CustomStackProvider } from "@/stack"
import { AppLayoutClient } from "./layout-client"

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<CustomStackProvider>
			<AppLayoutClient>{children}</AppLayoutClient>
		</CustomStackProvider>
	)
}
