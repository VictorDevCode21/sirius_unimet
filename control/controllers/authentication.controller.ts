'use server'

import { AuthError } from 'next-auth'
import { signIn, signOut } from '@/control/auth/auth'
import { ROLE_HOME } from '@/control/auth/authorization'
import { loginSchema } from '@/control/validation/auth.schema'
import { findUserByEmail } from '@/data-access/repositories/user.repository'

export interface LoginState {
  error?: string
  email?: string
}

// Reduces any callback target to a same-origin path to avoid open redirects; null means no usable target.
function safeRedirect(target: FormDataEntryValue | null) {
  if (typeof target !== 'string' || !target) return null
  try {
    const url = new URL(target, 'http://localhost')
    return url.pathname === '/' || url.pathname.startsWith('/login') ? null : `${url.pathname}${url.search}`
  } catch {
    return null
  }
}

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '')
  const parsed = loginSchema.safeParse({ email, password: formData.get('password') })
  if (!parsed.success) return { error: parsed.error.issues[0].message, email }

  try {
    const user = await findUserByEmail(parsed.data.email)
    const home = user ? ROLE_HOME[user.role] : '/'
    await signIn('credentials', { ...parsed.data, redirectTo: safeRedirect(formData.get('callbackUrl')) ?? home })
    return {}
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.', email }
    }
    throw error
  }
}

export async function logout() {
  await signOut({ redirectTo: '/login' })
}
