'use server'

import { requireRole } from '@/control/auth/session'
import { runAction, type ActionResult } from '@/control/controllers/action-result'
import { subjectSchema, type SubjectInput } from '@/control/validation/subject.schema'
import { createSubject, findCareerSubjects } from '@/data-access/repositories/curriculum-management.repository'
import { assertValidSubject } from '@/domain/curriculum/subject-rules'
import { DomainError } from '@/domain/shared/domain-error'

// Registers a subject in a cell of the curriculum grid of a career.
export async function registerSubject(input: SubjectInput): Promise<ActionResult> {
  await requireRole('ADMIN')
  const parsed = subjectSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }
  const { careerId, ...data } = parsed.data

  return runAction(async () => {
    assertValidSubject(await findCareerSubjects(careerId), data)
    const subject = await createSubject(careerId, data)
    if (!subject) throw new DomainError(`El código ${data.code} o la celda del trimestre ${data.term}, rama ${data.branch} ya están ocupados.`)
    return `La materia ${subject.code} se registró en el trimestre ${subject.term}, rama ${subject.branch}.`
  }, ['/admin/curriculum'])
}
