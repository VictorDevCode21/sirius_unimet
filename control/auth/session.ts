import 'server-only'
import { redirect } from 'next/navigation'
import { auth } from '@/control/auth/auth'
import { ROLE_HOME } from '@/control/auth/authorization'
import type { Role } from '@/data-access/generated/prisma/enums'

// Re-checks session and role on the server for every controller call.
export async function requireRole(role: Role) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== role) redirect(ROLE_HOME[session.user.role])
  return session.user
}
