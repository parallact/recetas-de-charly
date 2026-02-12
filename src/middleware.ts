import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { NextResponse, type NextRequest } from 'next/server'

const intlMiddleware = createIntlMiddleware(routing)

const protectedPaths = ['/profile', '/bookmarks', '/my-recipes', '/recipes/new']

function getPathWithoutLocale(pathname: string): string {
  return pathname.replace(/^\/(es|en)/, '') || '/'
}

function isProtectedPath(pathname: string): boolean {
  const path = getPathWithoutLocale(pathname)
  if (protectedPaths.some(p => path === p || path.startsWith(p + '/'))) return true
  if (/^\/recipes\/[^/]+\/edit$/.test(path)) return true
  return false
}

export default function middleware(request: NextRequest) {
  if (isProtectedPath(request.nextUrl.pathname)) {
    const sessionToken = request.cookies.get('authjs.session-token') ||
                          request.cookies.get('__Secure-authjs.session-token')

    if (!sessionToken) {
      const localeMatch = request.nextUrl.pathname.match(/^\/(es|en)/)
      const locale = localeMatch?.[1] || 'es'
      const loginPath = locale === 'es' ? '/login' : `/${locale}/login`
      return NextResponse.redirect(new URL(loginPath, request.url))
    }
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
