import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createRemoteJWKSet, jwtVerify} from 'jose'
import { z } from 'zod'
import { checkAccessToken } from './stack'

const TupleSchema = z.tuple([z.string(), z.string()])

async function verifyToken(token: string) {
  try {
    const jwks = createRemoteJWKSet(new URL(`https://api.stack-auth.com/api/v1/projects/${process.env.NEXT_PUBLIC_STACK_PROJECT_ID}/.well-known/jwks.json`));
    const { payload } = await jwtVerify(token, jwks);

    return { success: true, payload, error: null } as const
  } catch (error) {
    return { success: false, error, payload: null } as const
  }
}

export async function middleware(request: NextRequest) {
  // Skip auth check for public routes
  if (
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/handler') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api')
  ) {
    return NextResponse.next()
  }

  const userSub = await checkAccessToken(request.cookies)


	if (!userSub) {
		return NextResponse.redirect(
			new URL(
        // TODO: implement this redirect
				"/handler/login?redirect=" + encodeURIComponent('blag'),
				request.url,
			),
		)
	}
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
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 
