import "server-only"

import { z } from "zod"
import { ReactNode } from "react"
import { StackProvider, StackServerApp, StackTheme } from "@stackframe/stack"
import { remember } from "@epic-web/remember"
import { createRemoteJWKSet } from "jose/jwks/remote"
import { jwtVerify } from "jose/jwt/verify"
import { NextRequest, NextResponse } from "next/server"
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies"
import { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies"
import { CustomUserProvider } from "./stack-client"

export function logout(request: NextRequest) {
	return NextResponse.redirect(new URL("/handler/sign-out", request.url))
}

export const stackServerApp = remember(
	"stack-server",
	() =>
		new StackServerApp({
			tokenStore: "nextjs-cookie",
			redirectMethod: "nextjs",
			urls: {
				afterSignIn: "/app",
			},
		}),
)

const TupleSchema = z.tuple([z.string(), z.string()])

const jwks = createRemoteJWKSet(
	new URL(
		`https://api.stack-auth.com/api/v1/projects/${process.env.NEXT_PUBLIC_STACK_PROJECT_ID}/.well-known/jwks.json`,
	),
)

async function verifyToken(token: string) {
	try {
		const { payload } = await jwtVerify(token, jwks)
		return { success: true, payload, error: null } as const
	} catch (error) {
		return { success: false, error, payload: null } as const
	}
}

export async function getAccessToken(cookies: ReadonlyRequestCookies | RequestCookies) {
	const accessToken = cookies.get("stack-access")?.value
	if (!accessToken) return null

	const tokenTuple = TupleSchema.safeParse(JSON.parse(accessToken))
	if (!tokenTuple.success) return null

	return tokenTuple.data[1]
}

/**
 * Check access token in the cookie
 * Use this in middleware
 */
export async function checkAccessToken(cookies: ReadonlyRequestCookies | RequestCookies) {
	const accessToken = await getAccessToken(cookies)
	if (!accessToken) return null

	const { payload, success } = await verifyToken(accessToken)
	if (!success) return null

	return payload.sub
}

export function StackAuthProvider({ children }: { children: ReactNode }) {
	return (
		<StackProvider app={stackServerApp}>
			<StackTheme
				theme={{
					light: {
						// Base colors
						background: "#fbf1dc",
						foreground: "#5b3d2c",
						card: "#fbeed5",
						cardForeground: "#5b3d2c",
						popover: "#fbf1dc",
						popoverForeground: "#5b3d2c",

						// Brand colors
						primary: "#f07e38",
						primaryForeground: "#fefaef",
						secondary: "#bae4c5",
						secondaryForeground: "#2f5c35",

						// Utility colors
						muted: "#f3e1d0",
						mutedForeground: "#90705c",
						accent: "#f8c655",
						accentForeground: "#774b00",
						destructive: "#f5312f",
						destructiveForeground: "#fefaef",

						// Border and focus
						border: "#e8cfba",
						input: "#eddaca",
						ring: "#f07e38",
					},
					dark: {
						// Base colors
						background: "#302817",
						foreground: "#efd9cd",
						card: "#382c15",
						cardForeground: "#efd9cd",
						popover: "#302817",
						popoverForeground: "#efd9cd",

						// Brand colors
						primary: "#ba480b",
						primaryForeground: "#f3eee0",
						secondary: "#1f5432",
						secondaryForeground: "#c5e9c7",

						// Utility colors
						muted: "#3c2a18",
						mutedForeground: "#c8a691",
						accent: "#a5770f",
						accentForeground: "#241100",
						destructive: "#c20000",
						destructiveForeground: "#e3decf",

						// Border and focus
						border: "#5b422a",
						input: "#4a3624",
						ring: "#ba480b",
					},
					radius: "1rem",
				}}
			>
				<CustomUserProvider>{children}</CustomUserProvider>
			</StackTheme>
		</StackProvider>
	)
}
