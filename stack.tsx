import "server-only"

import { StackProvider, StackServerApp, StackTheme } from "@stackframe/stack"
import { remember } from "@epic-web/remember"
import { z } from "zod"
import { createRemoteJWKSet } from "jose/jwks/remote"
import { jwtVerify } from "jose/jwt/verify"
import { NextRequest, NextResponse } from "next/server"
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies"
import { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies"
import { ReactNode } from "react"
import { CustomUserProvider } from "./stack-client"

// TODO: do we want this abstraction?
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

export function CustomStackProvider({ children }: { children: ReactNode }) {
	return (
		<StackProvider app={stackServerApp}>
			<StackTheme>
				<CustomUserProvider>{children}</CustomUserProvider>
			</StackTheme>
		</StackProvider>
	)
}
