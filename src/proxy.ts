import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { NextResponse, type NextRequest } from 'next/server'

const intlMiddleware = createIntlMiddleware(routing)

const protectedPaths = ['/profile', '/bookmarks', '/my-recipes', '/recipes/new']

function isProtectedPath(pathname: string): boolean {
  if (protectedPaths.some(p => pathname === p || pathname.startsWith(p + '/'))) return true
  if (/^\/recipes\/[^/]+\/edit$/.test(pathname)) return true
  return false
}

export default function middleware(request: NextRequest) {
  if (isProtectedPath(request.nextUrl.pathname)) {
    const sessionToken = request.cookies.get('authjs.session-token') ||
                          request.cookies.get('__Secure-authjs.session-token')

    if (!sessionToken) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
