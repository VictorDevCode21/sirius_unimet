// Simulated payment rules: which enrollments can be paid, the status each outcome leads to and the payment reference.
import { DomainError } from '@/domain/shared/domain-error'

export type PaymentOutcome = 'APPROVED'
export type EnrollmentStatusName = 'PRE_ENROLLED' | 'PENDING' | 'CONFIRMED'

export const PAYABLE_STATUSES: EnrollmentStatusName[] = ['PRE_ENROLLED']

export function validatePayable(enrollment: { status: EnrollmentStatusName; sections: number; amount: number } | null) {
  if (!enrollment) throw new DomainError('No tienes una pre-inscripción en el período abierto. Pre-inscribe tus materias antes de pagar.')
  if (enrollment.status === 'CONFIRMED') throw new DomainError('Tu inscripción ya está pagada y confirmada. No se realizó un nuevo cobro.')
  if (!PAYABLE_STATUSES.includes(enrollment.status)) throw new DomainError('Tu inscripción no admite pagos en este momento.')
  if (enrollment.sections === 0) throw new DomainError('Tu pre-inscripción no tiene secciones. Agrega al menos una antes de pagar.')
  if (enrollment.amount <= 0) throw new DomainError('El monto a pagar no es válido. Revisa tu pre-inscripción.')
}

export function statusAfterPayment(outcome: 'APPROVED' | 'REJECTED'): EnrollmentStatusName {
  return outcome === 'APPROVED' ? 'CONFIRMED' : 'PENDING'
}

// One reference per payment attempt, so retrying the same request never creates a second payment.
export function paymentReference(termName: string, attemptId: string) {
  return `SIM-${termName}-${attemptId.replace(/-/g, '').slice(0, 12).toUpperCase()}`
}
