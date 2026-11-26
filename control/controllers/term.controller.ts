'use server'

import { requireRole } from '@/control/auth/session'
import { runAction, type ActionResult } from '@/control/controllers/action-result'
import { createTermSchema } from '@/control/validation/term.schema'
import { createTerm as insertTerm } from '@/data-access/repositories/term-management.repository'
import { DomainError } from '@/domain/shared/domain-error'
import { validateTermDates } from '@/domain/terms/term-rules'

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
