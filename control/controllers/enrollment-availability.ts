import 'server-only'
import { requireRole } from '@/control/auth/session'
import { findNextTerm, findOpenTerm } from '@/data-access/repositories/term.repository'
import { describeEnrollmentAvailability } from '@/domain/terms/term-rules'

// Read flag for the student portal: tells whether the pre-enrollment entry points must be offered and, when no term is
// open, the dates of the next term.
export async function getEnrollmentAvailability() {
  await requireRole('STUDENT')
  const [openTerm, nextTerm] = await Promise.all([findOpenTerm(), findNextTerm(new Date())])
  return describeEnrollmentAvailability(openTerm, nextTerm)
}
