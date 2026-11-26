// Offer rules: which subjects show sections in the pre-enrollment offer and how many seats a section has left.
import type { SubjectStatus } from '@/domain/prerequisites/prerequisite-engine'

// Only subjects the student can take (prerequisites met, not passed, not in progress) list their sections.
export function isOfferable(status: SubjectStatus) {
  return status === 'AVAILABLE'
}

export function seatsLeft(capacity: number, occupied: number) {
  return Math.max(0, capacity - occupied)
}

export function isSectionFull(capacity: number, occupied: number) {
  return seatsLeft(capacity, occupied) === 0
}
