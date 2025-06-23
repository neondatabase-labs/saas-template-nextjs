import { StackAuthProvider } from "@/lib/stack-auth/stack"
import { AppLayoutClient } from "./layout-client"

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<StackAuthProvider>
			<AppLayoutClient>{children}</AppLayoutClient>
		</StackAuthProvider>
	)
}
