import 'server-only'
import { cache } from 'react'
import { requireRole } from '@/control/auth/session'
import { findEnrollment } from '@/data-access/repositories/enrollment.repository'
import { findOpenTerm } from '@/data-access/repositories/term.repository'
import { findStudentProfile } from '@/data-access/repositories/user.repository'
import { getSubjectStates } from '@/domain/prerequisites/prerequisite.service'

// Loads the signed-in student and their academic state once per request.
export const getStudentContext = cache(async () => {
  const user = await requireRole('STUDENT')
  const profile = await findStudentProfile(user.id)
  if (!profile.career) throw new Error('Student without career')
  const state = await getSubjectStates(profile.id, profile.career.id)
  return { profile: { ...profile, career: profile.career }, ...state }
})

// Data shown in the student portal shell: identity, current term, open term and selected sections.
export const getPortalSummary = cache(async () => {
  const { profile, currentTerm } = await getStudentContext()
  const openTerm = await findOpenTerm()
  const enrollment = openTerm ? await findEnrollment(profile.id, openTerm.id) : null
  return {
    user: { name: profile.name, email: profile.email },
    currentTermName: currentTerm?.name ?? null,
    openTermName: openTerm?.name ?? null,
    selectedSections: enrollment?.details.length ?? 0,
  }
})
