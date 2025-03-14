import "server-only"

import { StackServerApp } from "@stackframe/stack"
import { remember } from "@epic-web/remember"
import { z } from "zod"
import { createRemoteJWKSet } from "jose/jwks/remote"
import { jwtVerify } from "jose/jwt/verify"
import { NextRequest, NextResponse } from "next/server"

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

async function verifyToken(token: string) {
	try {
		const jwks = createRemoteJWKSet(
			new URL(
				`https://api.stack-auth.com/api/v1/projects/${process.env.NEXT_PUBLIC_STACK_PROJECT_ID}/.well-known/jwks.json`,
			),
		)
		const { payload } = await jwtVerify(token, jwks)

		return { success: true, payload, error: null } as const
	} catch (error) {
		return { success: false, error, payload: null } as const
	}
}

/**
 * Check access token in the cookie
 * Use this in middleware
 */
export async function checkAccessToken(request: NextRequest) {
	const accessToken = request.cookies.get("stack-access")?.value
	if (!accessToken) return null

	const tokenTuple = TupleSchema.safeParse(JSON.parse(accessToken))
	if (!tokenTuple.success) return null

	const { payload, success } = await verifyToken(tokenTuple.data[1])
	if (!success) return null

	console.log("Authenticated user with ID:", payload)
	return payload.sub
}
