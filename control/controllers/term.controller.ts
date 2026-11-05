'use server'

import { requireRole } from '@/control/auth/session'
import { runAction, type ActionResult } from '@/control/controllers/action-result'
import { createTermSchema, termIdSchema } from '@/control/validation/term.schema'
import {
  closeTerm as markTermClosed,
  createTerm as insertTerm,
  openTerm as markTermOpen,
} from '@/data-access/repositories/term-management.repository'
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
    const term = await markTermOpen(parsed.data, (candidate, openTerm) => validateCanOpenTerm(candidate, openTerm, new Date()))
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
