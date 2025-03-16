import "server-only"

import { StackServerApp } from "@stackframe/stack"
import { remember } from "@epic-web/remember"
import { z } from "zod"
import { createRemoteJWKSet } from "jose/jwks/remote"
import { jwtVerify } from "jose/jwt/verify"
import { NextRequest, NextResponse } from "next/server"
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies"
import { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies"

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
				afterSignIn: "/settings/user",
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
		const verifyStart = performance.now()
		const { payload } = await jwtVerify(token, jwks)
		const verifyEnd = performance.now()
		console.log("verify", verifyEnd - verifyStart)
		return { success: true, payload, error: null } as const
	} catch (error) {
		return { success: false, error, payload: null } as const
	}
}

/**
 * Check access token in the cookie
 * Use this in middleware
 */
export async function checkAccessToken(cookies: ReadonlyRequestCookies | RequestCookies) {
	const checkStart = performance.now()
	const readCookieStart = performance.now()
	const accessToken = cookies.get("stack-access")?.value
	const readCookieEnd = performance.now()
	console.log("readCookie", readCookieEnd - readCookieStart)

	if (!accessToken) return null

	const parseCookieStart = performance.now()
	const tokenTuple = TupleSchema.safeParse(JSON.parse(accessToken))
	const parseCookieEnd = performance.now()
	console.log("parseCookie", parseCookieEnd - parseCookieStart)

	if (!tokenTuple.success) return null

	const verifyTokenStart = performance.now()
	const { payload, success } = await verifyToken(tokenTuple.data[1])
	const verifyTokenEnd = performance.now()
	console.log("verifyToken", verifyTokenEnd - verifyTokenStart)

	if (!success) return null

	console.log("Authenticated user with ID:", payload)
	const checkEnd = performance.now()
	console.log("checkAccessToken", checkEnd - checkStart)
	console.log("returning access token", payload.sub)
	return payload.sub
}
