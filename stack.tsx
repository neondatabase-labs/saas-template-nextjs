import "server-only"

import { StackServerApp } from "@stackframe/stack"
import { remember } from "@epic-web/remember"

export const stackServerApp = remember(
	"stack-server",
	() =>
		new StackServerApp({
			tokenStore: "nextjs-cookie",
		}),
)
