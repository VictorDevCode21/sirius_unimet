import 'server-only'
import { requireRole } from '@/control/auth/session'
import { userIdSchema } from '@/control/validation/user.schema'
import { findUserForEdit, listActiveCareers, listUsers } from '@/data-access/repositories/user-management.repository'

export async function getUsers() {
  await requireRole('ADMIN')
  return listUsers()
}

export type UserRow = Awaited<ReturnType<typeof getUsers>>[number]

export async function getAssignableCareers() {
  await requireRole('ADMIN')
  return listActiveCareers()
}

export type CareerOption = Awaited<ReturnType<typeof getAssignableCareers>>[number]

// Returns null when the id is malformed or the user does not exist.
export async function getUserForEdit(rawUserId: string) {
  await requireRole('ADMIN')
  const parsed = userIdSchema.safeParse(rawUserId)
  if (!parsed.success) return null
  const user = await findUserForEdit(parsed.data)
  return user && { id: user.id, name: user.name, email: user.email, role: user.role, active: user.active, careerId: user.careerId }
}

export type EditableUser = NonNullable<Awaited<ReturnType<typeof getUserForEdit>>>
