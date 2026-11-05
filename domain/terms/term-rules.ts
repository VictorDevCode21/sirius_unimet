// Term rules: date consistency of an academic period.
import { DomainError } from '@/domain/shared/domain-error'

export function validateTermDates(startsAt: Date, endsAt: Date) {
  if (endsAt <= startsAt) throw new DomainError('La fecha de fin debe ser posterior a la fecha de inicio.')
}

interface OpenCandidate {
  id: string
  endsAt: Date
  ratePerCredit: number
  maxCredits: number
}

// Only one term can receive enrollments at a time, a finished term cannot be reopened, and the fee and max
// credits must be set.
export function validateCanOpenTerm(term: OpenCandidate, openTerm: { id: string; name: string } | null, today: Date) {
  if (openTerm && openTerm.id !== term.id) {
    throw new DomainError(`Ya hay un periodo abierto: ${openTerm.name}. Ciérralo antes de abrir otro.`)
  }
  if (term.endsAt < today) throw new DomainError('No se puede abrir un periodo que ya terminó.')
  if (term.ratePerCredit <= 0) throw new DomainError('Configura el monto por UC antes de abrir el periodo.')
  if (term.maxCredits <= 0) throw new DomainError('Configura el máximo de UC antes de abrir el periodo.')
}

export function isEnrollmentOpen(openTerm: { open: boolean } | null) {
  return openTerm?.open === true
}
