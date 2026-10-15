import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export const authConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Role', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Mock authentication - in production, query a database
        const mockUsers: Record<
          string,
          {
            id: string
            name: string
            email: string
            role: string
            carrera: string
            cedula?: string
            imagen?: string
          }
        > = {
          'student@unimet.edu.ve': {
            id: '1',
            name: 'Carlos Mendoza',
            email: 'student@unimet.edu.ve',
            role: 'student',
            carrera: 'Ingeniería de Sistemas',
            cedula: '28.456.789',
            imagen:
              'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
          },
          'professor@unimet.edu.ve': {
            id: '2',
            name: 'Dra. María González',
            email: 'professor@unimet.edu.ve',
            role: 'professor',
            carrera: 'Ingeniería de Sistemas',
            imagen:
              'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
          },
          'admin@unimet.edu.ve': {
            id: '3',
            name: 'Admin Sistema',
            email: 'admin@unimet.edu.ve',
            role: 'admin',
            carrera: 'Administración',
            imagen:
              'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
          },
        }

        const user = mockUsers[credentials.email as string]
        if (user && credentials.password === 'password') {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            carrera: user.carrera,
            cedula: user.cedula,
            imagen: user.imagen,
          }
        }

        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.carrera = user.carrera
        token.cedula = user.cedula
        token.imagen = user.imagen
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.carrera = token.carrera as string
        session.user.cedula = token.cedula as string
        session.user.imagen = token.imagen as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
} satisfies NextAuthConfig
