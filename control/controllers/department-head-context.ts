import 'server-only'
import { cache } from 'react'
import { requireRole } from '@/control/auth/session'
import { findDepartmentByHead } from '@/data-access/repositories/section-management.repository'
import { findOpenTerm, findTermByDate } from '@/data-access/repositories/term.repository'

// Loads the signed-in department head and the department they manage once per request.
export const getDepartmentHeadContext = cache(async () => {
  const user = await requireRole('DEPARTMENT_HEAD')
  const department = await findDepartmentByHead(user.id)
  return { user: { id: user.id, name: user.name ?? '', email: user.email ?? '' }, department }
})

// Data shown in the department head portal shell.
export const getDepartmentHeadSummary = cache(async () => {
  const { user } = await getDepartmentHeadContext()
  const [currentTerm, openTerm] = await Promise.all([findTermByDate(new Date()), findOpenTerm()])
  return { user: { name: user.name, email: user.email }, currentTermName: currentTerm?.name ?? null, openTermName: openTerm?.name ?? null }
})
