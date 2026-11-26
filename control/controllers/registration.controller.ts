'use server'

import { runAction, type ActionResult } from '@/control/controllers/action-result'
import { confirmEnrollmentSeats } from '@/control/controllers/enrollment-seats'
import { getEnrollmentAmount } from '@/control/controllers/enrollment-summary.controller'
import { getStudentContext } from '@/control/controllers/student-context'
import { getFinancialHold, getStudentTurn } from '@/control/controllers/student-standing'
import { enrollSchema, type EnrollInput } from '@/control/validation/registration.schema'
import { confirmPreEnrollment, findEnrollment } from '@/data-access/repositories/enrollment.repository'
import { findOpenTerm } from '@/data-access/repositories/term.repository'
import { assertNoFinancialHold } from '@/domain/billing/account-balance'
import { validateTermOpen } from '@/domain/enrollment/enrollment-validator'
import { assertCanEnroll, assertTurnActive } from '@/domain/enrollment/registration-rules'
import { DomainError } from '@/domain/shared/domain-error'

// Enrolls the student in the chosen sections of their pre-enrollment of the open term: checks the turn, the financial
// hold and the seats (locked until the enrollment is saved). The fee is not charged here; it is paid in Pagos.
export async function enroll(input: EnrollInput): Promise<ActionResult> {
  const parsed = enrollSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  return runAction(async () => {
    const { profile } = await getStudentContext()
    const term = await findOpenTerm()
    validateTermOpen(term)

    const turn = await getStudentTurn(profile.id, term!)
    assertTurnActive(turn)
    assertNoFinancialHold(await getFinancialHold(profile.id, term!.startsAt))

    const enrollment = await findEnrollment(profile.id, term!.id)
    if (!enrollment || !enrollment.details.length) {
      throw new DomainError('No tienes materias pre-inscritas en este período. Pre-inscribe tus materias antes de inscribir.')
    }
    const preEnrolled = new Set(enrollment.details.map((detail) => detail.sectionId))
    if (parsed.data.sectionIds.some((id) => !preEnrolled.has(id))) {
      throw new DomainError('Una de las secciones ya no está en tu pre-inscripción. Recarga la página.')
    }

    const confirmed = await confirmPreEnrollment({
      enrollmentId: enrollment.id,
      keepSectionIds: parsed.data.sectionIds,
      assertEnrollable: assertCanEnroll,
      takeSeats: (tx) => confirmEnrollmentSeats(enrollment.id, tx),
      computeAmount: (tx) => getEnrollmentAmount(enrollment.id, tx),
    })
    if (!confirmed) throw new DomainError('No se encontró tu pre-inscripción. Recarga la página.')
    const count = confirmed.details.length
    return `Inscripción completada: ${count} ${count === 1 ? 'materia' : 'materias'} en el período ${term!.name}. Tu certificado de inscripción ya está disponible; puedes realizar el pago en Pagos.`
  }, ['/student'])
}
