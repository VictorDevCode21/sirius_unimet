// Registration rules: when a pre-enrollment can become an enrollment with seats.
import { DomainError } from '@/domain/shared/domain-error'
import type { TurnState } from '@/domain/enrollment/enrollment-turn'

const caracas = new Intl.DateTimeFormat('es-VE', {
  timeZone: 'America/Caracas',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: 'numeric',
  minute: '2-digit',
})

export function describeTurn(turnAt: Date) {
  return caracas.format(turnAt)
}

// The student enrolls from the start of their turn until the enrollment window closes.
export function assertTurnActive(turn: { state: TurnState; turnAt: Date | null }) {
  if (turn.state === 'NOT_SCHEDULED') throw new DomainError('La inscripción de este período todavía no tiene fecha. Revisa más adelante.')
  if (turn.state === 'UPCOMING') throw new DomainError(`Aún no es tu turno. Podrás inscribir desde el ${describeTurn(turn.turnAt!)}.`)
  if (turn.state === 'CLOSED') throw new DomainError('La inscripción de este período ya cerró.')
}

// Only a saved selection (pre-enrolled, or pending from an earlier payment attempt) can be enrolled, once.
export function assertCanEnroll(status: string) {
  if (status === 'CONFIRMED') throw new DomainError('Ya estás inscrito en este período.')
  if (status !== 'PRE_ENROLLED' && status !== 'PENDING') throw new DomainError('Tu pre-inscripción no se puede inscribir en este momento.')
}
