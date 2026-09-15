import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Match all pathnames except for API routes, Next.js internals and
  // static files (public/ assets are fetched client-side, so they must not
  // be redirected into the locale routing).
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
