// Term rules: date consistency of an academic period.
import { DomainError } from '@/domain/shared/domain-error'

export function validateTermDates(startsAt: Date, endsAt: Date) {
  if (endsAt <= startsAt) throw new DomainError('La fecha de fin debe ser posterior a la fecha de inicio.')
}
