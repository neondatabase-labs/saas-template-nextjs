import { StackHandler } from "@stackframe/stack"
import { StackAuthProvider, stackServerApp } from "../../../lib/stack-auth/stack"

export default function Handler(props: unknown) {
	return (
		<StackAuthProvider>
			<StackHandler fullPage app={stackServerApp} routeProps={props} />
		</StackAuthProvider>
	)
}
