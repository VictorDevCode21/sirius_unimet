// Term rules: date consistency of an academic period.
import { DomainError } from '@/domain/shared/domain-error'

export function validateTermDates(startsAt: Date, endsAt: Date) {
  if (endsAt <= startsAt) throw new DomainError('La fecha de fin debe ser posterior a la fecha de inicio.')
}

interface OpenCandidate {
  id: string
  endsAt: Date
  ratePerCredit: number
}

// Only one term can receive enrollments at a time, a finished term cannot be reopened and the fee must be set.
export function validateCanOpenTerm(term: OpenCandidate, openTerm: { id: string; name: string } | null, today: Date) {
  if (openTerm && openTerm.id !== term.id) {
    throw new DomainError(`Ya hay un periodo abierto: ${openTerm.name}. Ciérralo antes de abrir otro.`)
  }
  if (term.endsAt < today) throw new DomainError('No se puede abrir un periodo que ya terminó.')
  if (term.ratePerCredit <= 0) throw new DomainError('Configura el monto por UC antes de abrir el periodo.')
}

export function isEnrollmentOpen(openTerm: { open: boolean } | null) {
  return openTerm?.open === true
}

interface TermWindow {
  name: string
  startsAt: Date
  endsAt: Date
}

// What the student portal offers: pre-enrollment for the open term, or the dates of the next term when none is open.
export function describeEnrollmentAvailability(openTerm: ({ open: boolean } & TermWindow) | null, nextTerm: TermWindow | null) {
  if (isEnrollmentOpen(openTerm)) return { isOpen: true as const, termName: openTerm!.name, nextTerm: null }
  return {
    isOpen: false as const,
    termName: null,
    nextTerm: nextTerm ? { name: nextTerm.name, startsAt: nextTerm.startsAt, endsAt: nextTerm.endsAt } : null,
  }
}

export type EnrollmentAvailability = ReturnType<typeof describeEnrollmentAvailability>
