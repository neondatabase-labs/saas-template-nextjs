import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkAccessToken } from './stack'

function isProtectedRoute(url: string) {
  if (url.startsWith('/app')) return true 
  return false 
}

export async function middleware(request: NextRequest) {
  // Skip auth check for public routes
  if (isProtectedRoute(request.nextUrl.pathname)) {
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
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 
