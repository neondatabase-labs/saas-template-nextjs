import { StackHandler } from "@stackframe/stack"
import { CustomStackProvider, stackServerApp } from "../../../stack"

export default function Handler(props: unknown) {
	return (
		<CustomStackProvider>
			<StackHandler fullPage app={stackServerApp} routeProps={props} />
		</CustomStackProvider>
	)
}
