import 'server-only'
import { cache } from 'react'
import { requireRole } from '@/control/auth/session'
import { findTeachingTerm } from '@/data-access/repositories/professor-section.repository'

// Loads the signed-in professor and the term they work on once per request.
export const getProfessorContext = cache(async () => {
  const user = await requireRole('PROFESSOR')
  const term = await findTeachingTerm(new Date())
  return { user: { id: user.id, name: user.name ?? '', email: user.email ?? '' }, term }
})
