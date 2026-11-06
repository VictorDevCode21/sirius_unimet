import 'server-only'
import { requireRole } from '@/control/auth/session'
import { findOpenTerm } from '@/data-access/repositories/term.repository'
import { isEnrollmentOpen } from '@/domain/terms/term-rules'

// Read flag for the student portal: tells whether the "Inscribirme" option must be offered, and for which period.
export async function getEnrollmentAvailability() {
  await requireRole('STUDENT')
  const openTerm = await findOpenTerm()
  return { isOpen: isEnrollmentOpen(openTerm), termName: openTerm?.name ?? null }
}
