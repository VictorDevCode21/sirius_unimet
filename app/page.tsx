import { redirect } from 'next/navigation'
import { auth } from '@/control/auth/auth'
import { ROLE_HOME } from '@/control/auth/authorization'

export default async function HomePage() {
  const session = await auth()
  redirect(session?.user ? ROLE_HOME[session.user.role] : '/login')
}
