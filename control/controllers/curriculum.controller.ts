'use server'

import { requireRole } from '@/control/auth/session'
import { runAction, type ActionResult } from '@/control/controllers/action-result'
import {
  requirementsSchema,
  subjectSchema,
  subjectUpdateSchema,
  type RequirementsInput,
  type SubjectInput,
  type SubjectUpdateInput,
} from '@/control/validation/subject.schema'
import {
  createSubject,
  findCareerSubjects,
  findSubject,
  replaceSubjectRequirements,
  updateSubject,
} from '@/data-access/repositories/curriculum-management.repository'
import { validateRequirements } from '@/domain/curriculum/prerequisite-rules'
import { assertValidSubject, validateTermOrder } from '@/domain/curriculum/subject-rules'
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

// Edits the data of a subject or moves it to another cell of the grid, keeping its prerequisites in order.
export async function editSubject(input: SubjectUpdateInput): Promise<ActionResult> {
  await requireRole('ADMIN')
  const parsed = subjectUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }
  const { subjectId, ...data } = parsed.data

  return runAction(async () => {
    const current = await findSubject(subjectId)
    if (!current) throw new DomainError('La materia ya no existe.')
    assertValidSubject(await findCareerSubjects(current.careerId), data, subjectId)
    const orderErrors = validateTermOrder(
      data.term,
      current.prerequisites.map((prerequisite) => prerequisite.requirement),
      current.requiredBy.map((dependent) => dependent.subject),
    )
    if (orderErrors.length) throw new DomainError(orderErrors.join(' '))

    const subject = await updateSubject(subjectId, data)
    if (!subject) throw new DomainError(`El código ${data.code} o la celda del trimestre ${data.term}, rama ${data.branch} ya están ocupados.`)
    const moved = subject.term !== current.term || subject.branch !== current.branch
    return moved
      ? `La materia ${subject.code} se movió al trimestre ${subject.term}, rama ${subject.branch}.`
      : `La materia ${subject.code} se actualizó.`
  }, ['/admin/curriculum'])
}

// Defines the subjects a subject requires, the minimum passed credits and the credit alternative that replaces them.
export async function defineRequirements(input: RequirementsInput): Promise<ActionResult> {
  await requireRole('ADMIN')
  const parsed = requirementsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }
  const { subjectId, ...requirements } = parsed.data

  return runAction(async () => {
    const subject = await findSubject(subjectId)
    if (!subject) throw new DomainError('La materia ya no existe.')
    const curriculum = (await findCareerSubjects(subject.careerId)).map((other) => ({
      ...other,
      prerequisiteIds: other.prerequisites.map((prerequisite) => prerequisite.requirementId),
    }))
    const errors = validateRequirements(curriculum, subjectId, requirements)
    if (errors.length) throw new DomainError(errors.join(' '))

    await replaceSubjectRequirements(subjectId, requirements)
    const count = requirements.requirementIds.length
    return `Se guardaron ${count} ${count === 1 ? 'prelación' : 'prelaciones'} de ${subject.code}.`
  }, ['/admin/curriculum'])
}
