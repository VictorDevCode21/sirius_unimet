import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { authConfig } from '@/control/auth/auth.config'
import { loginSchema } from '@/control/validation/auth.schema'
import { findUserByEmail } from '@/data-access/repositories/user.repository'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Correo', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(rawCredentials) {
        const parsed = loginSchema.safeParse(rawCredentials)
        if (!parsed.success) return null

        const user = await findUserByEmail(parsed.data.email)
        if (!user?.active) return null

        const passwordMatches = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!passwordMatches) return null

        return { id: user.id, name: user.name, email: user.email, role: user.role }
      },
    }),
  ],
})
