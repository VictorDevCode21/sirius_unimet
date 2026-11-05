'use server'

import { requireRole } from '@/control/auth/session'
import { runAction, type ActionResult } from '@/control/controllers/action-result'
import { createTermSchema, maxCreditsSchema, ratePerCreditSchema, termIdSchema } from '@/control/validation/term.schema'
import {
  closeTerm as markTermClosed,
  createTerm as insertTerm,
  openTerm as markTermOpen,
  updateMaxCredits,
  updateRatePerCredit,
} from '@/data-access/repositories/term-management.repository'
import { repriceEnrollment } from '@/domain/billing/repricing'
import { DomainError } from '@/domain/shared/domain-error'
import { validateCanOpenTerm, validateTermDates } from '@/domain/terms/term-rules'

// Creates an academic period, closed by default.
export async function createTerm(input: { name: string; startsAt: string; endsAt: string }): Promise<ActionResult> {
  await requireRole('ADMIN')
  const parsed = createTermSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  return runAction(async () => {
    validateTermDates(parsed.data.startsAt, parsed.data.endsAt)
    const term = await insertTerm(parsed.data)
    if (!term) throw new DomainError(`Ya existe un periodo con el nombre ${parsed.data.name}.`)
    return `El periodo ${term.name} se creó cerrado.`
  }, ['/admin/terms'])
}

const TERM_NOT_FOUND = 'El periodo no existe. Recarga la página.'

// Opens enrollment for a period, unless another period is already open.
export async function openEnrollment(rawTermId: string): Promise<ActionResult> {
  await requireRole('ADMIN')
  const parsed = termIdSchema.safeParse(rawTermId)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  return runAction(async () => {
    const term = await markTermOpen(parsed.data, (candidate, openTerm) =>
      validateCanOpenTerm({ ...candidate, ratePerCredit: Number(candidate.ratePerCredit) }, openTerm, new Date()),
    )
    if (!term) throw new DomainError(TERM_NOT_FOUND)
    return `La inscripción del periodo ${term.name} está abierta.`
  }, ['/admin', '/student'])
}

// Closes enrollment for a period, so students can no longer enroll in it.
export async function closeEnrollment(rawTermId: string): Promise<ActionResult> {
  await requireRole('ADMIN')
  const parsed = termIdSchema.safeParse(rawTermId)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  return runAction(async () => {
    const term = await markTermClosed(parsed.data)
    if (!term) throw new DomainError(TERM_NOT_FOUND)
    return `La inscripción del periodo ${term.name} está cerrada.`
  }, ['/admin', '/student'])
}

// Saves the fee per credit of a period; unpaid enrollments are repriced and paid ones keep their amount.
export async function saveRatePerCredit(input: { termId: string; ratePerCredit: string }): Promise<ActionResult> {
  await requireRole('ADMIN')
  const parsed = ratePerCreditSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  return runAction(async () => {
    const { termId, ratePerCredit } = parsed.data
    const term = await updateRatePerCredit(termId, ratePerCredit, (enrollment) => repriceEnrollment(enrollment, ratePerCredit))
    if (!term) throw new DomainError(TERM_NOT_FOUND)
    return `El monto por UC del periodo ${term.name} se guardó.`
  }, ['/admin', '/student'])
}

// Saves the max credits per trimester of a period; enrollment validation reads this value from the term.
export async function saveMaxCredits(input: { termId: string; maxCredits: string }): Promise<ActionResult> {
  await requireRole('ADMIN')
  const parsed = maxCreditsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  return runAction(async () => {
    const term = await updateMaxCredits(parsed.data.termId, parsed.data.maxCredits)
    if (!term) throw new DomainError(TERM_NOT_FOUND)
    return `El máximo de UC del periodo ${term.name} se guardó.`
  }, ['/admin', '/student'])
}
