import 'server-only'
import { requireRole } from '@/control/auth/session'
import { listActiveCareers, listUsers } from '@/data-access/repositories/user-management.repository'

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
