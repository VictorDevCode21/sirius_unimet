import NextAuth from 'next-auth'
import { authConfig } from '@/control/auth/auth.config'

// Authentication and RBAC middleware: validates session and role before every route.
export const { auth: middleware } = NextAuth(authConfig)

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)'],
}
