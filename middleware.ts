import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { checkAccessToken } from "./lib/stack-auth/stack"

function isProtectedRoute(url: string) {
	if (url.startsWith("/app")) return true
	return false
}

export async function middleware(request: NextRequest) {
	// Skip auth check for public routes
	if (isProtectedRoute(request.nextUrl.pathname)) {
		// We only check the access token for validity, we do not hit the StackAuth API
		// - middleware is called for every request, so we can't add such latency
		// - we need to check permissions before fetching/mutating anyway, so we do it in each action
		const userSub = await checkAccessToken(request.cookies)

		if (!userSub) {
			return NextResponse.redirect(
				new URL(
					"/handler/login?redirect=" +
						encodeURIComponent(
							request.nextUrl.pathname.startsWith("/handler")
								? "/todos"
								: request.nextUrl.pathname + request.nextUrl.search,
						),
					request.url,
				),
			)
		}
	}

	return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		"/((?!_next/static|_next/image|favicon.ico|public/).*)",
	],
}
