import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/control/auth/auth'
import { ROLE_HOME } from '@/control/auth/authorization'

export const metadata: Metadata = { title: 'Inicio | Sirius UNIMET' }

export default async function HomePage() {
  const session = await auth()
  redirect(session?.user ? ROLE_HOME[session.user.role] : '/login')
}
