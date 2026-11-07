import 'server-only'
import { cache } from 'react'
import { requireRole } from '@/control/auth/session'
import { findOpenTerm, findTermByDate } from '@/data-access/repositories/term.repository'

// Data shown in the admin portal shell.
export const getAdminSummary = cache(async () => {
  const user = await requireRole('ADMIN')
  const [currentTerm, openTerm] = await Promise.all([findTermByDate(new Date()), findOpenTerm()])
  return {
    user: { name: user.name ?? '', email: user.email ?? '' },
    currentTermName: currentTerm?.name ?? null,
    openTermName: openTerm?.name ?? null,
  }
})
