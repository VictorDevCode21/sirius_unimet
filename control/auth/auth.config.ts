import type { NextAuthConfig } from 'next-auth'
import { NextResponse } from 'next/server'
import { PUBLIC_ROUTES, ROLE_HOME, authorize } from '@/control/auth/authorization'

// Edge-safe configuration shared by the middleware and the full Auth.js instance.
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 8,
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const user = auth?.user
      const isPublicRoute = PUBLIC_ROUTES.some((route) => nextUrl.pathname.startsWith(route))

      if (isPublicRoute) return user ? NextResponse.redirect(new URL(ROLE_HOME[user.role], nextUrl)) : true
      if (!user) return false
      if (nextUrl.pathname === '/') return NextResponse.redirect(new URL(ROLE_HOME[user.role], nextUrl))
      if (!authorize(user.role, nextUrl.pathname)) {
        return NextResponse.rewrite(new URL('/forbidden', nextUrl), { status: 403 })
      }
      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id
      session.user.role = token.role
      return session
    },
  },
} satisfies NextAuthConfig
