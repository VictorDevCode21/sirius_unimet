'use server'

import { revalidatePath } from 'next/cache'
import { getStudentContext } from '@/control/controllers/student-context'
import { simulatePaymentSchema, type SimulatePaymentInput } from '@/control/validation/payment.schema'
import { findEnrollment } from '@/data-access/repositories/enrollment.repository'
import { recordSimulatedPayment } from '@/data-access/repositories/payment.repository'
import { findOpenTerm } from '@/data-access/repositories/term.repository'
import { calculateAmount } from '@/domain/billing/amount-calculator'
import { paymentReference, statusAfterPayment, validatePayable } from '@/domain/billing/payment-simulator'
import { validateTermOpen } from '@/domain/enrollment/enrollment-validator'
import { DomainError } from '@/domain/shared/domain-error'

export interface PaymentActionResult {
  ok: boolean
  message: string
  status?: 'APPROVED' | 'REJECTED'
  reference?: string
}

// Pays the student's pre-enrollment of the open term with the simulator. The server re-checks the status under a
// row lock, so repeated clicks or parallel requests never create a second approved payment.
export async function simulatePayment(input: SimulatePaymentInput): Promise<PaymentActionResult> {
  const parsed = simulatePaymentSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  try {
    const { profile } = await getStudentContext()
    const term = await findOpenTerm()
    validateTermOpen(term)
    const enrollment = await findEnrollment(profile.id, term!.id)
    if (!enrollment) validatePayable(null)

    const result = await recordSimulatedPayment({
      enrollmentId: enrollment!.id,
      reference: paymentReference(term!.name, parsed.data.attemptId),
      outcome: parsed.data.outcome,
      computeAmount: (credits) => calculateAmount(credits, Number(term!.ratePerCredit)),
      assertPayable: validatePayable,
      statusAfter: statusAfterPayment,
    })
    if (!result) throw new DomainError('No se encontró tu pre-inscripción. Recarga la página.')
    revalidatePath('/student', 'layout')

    const { payment } = result
    if (payment.status === 'APPROVED') {
      return { ok: true, status: 'APPROVED', reference: payment.reference, message: `Pago aprobado. Tu inscripción del período ${term!.name} quedó confirmada.` }
    }
    return { ok: false, status: 'REJECTED', reference: payment.reference, message: 'Pago rechazado. No se realizó ningún cobro.' }
  } catch (error) {
    if (error instanceof DomainError) return { ok: false, message: error.message }
    throw error
  }
}
