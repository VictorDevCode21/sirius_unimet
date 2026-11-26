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
  findCareer,
  findCareerSubjects,
  findSubject,
  replaceSubjectRequirements,
  updateSubject,
  type SubjectWriteConflict,
} from '@/data-access/repositories/curriculum-management.repository'
import { assertValidSubject, validateTermOrder } from '@/domain/curriculum/subject-rules'
import { DomainError } from '@/domain/shared/domain-error'

// Message for a write refused by the database, naming the value that is already taken.
function conflictMessage(conflict: SubjectWriteConflict, data: { code: string; term: number; branch: number }) {
  if (conflict === 'career') return 'La carrera seleccionada no existe. Recarga la página y elige otra carrera.'
  if (conflict === 'code') return `El código ${data.code} ya pertenece a otra materia de la carrera.`
  return `El trimestre ${data.term}, rama ${data.branch} ya tiene otra materia.`
}

// Registers a subject in a cell of the curriculum grid of a career.
export async function registerSubject(input: SubjectInput): Promise<ActionResult> {
  await requireRole('ADMIN')
  const parsed = subjectSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }
  const { careerId, ...data } = parsed.data

  return runAction(async () => {
    if (!(await findCareer(careerId))) throw new DomainError(conflictMessage('career', data))
    assertValidSubject(await findCareerSubjects(careerId), data)
    const result = await createSubject(careerId, data)
    if (!result.ok) throw new DomainError(conflictMessage(result.conflict, data))
    const { subject } = result
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

    const result = await updateSubject(subjectId, current.careerId, data)
    if (!result.ok) throw new DomainError(conflictMessage(result.conflict, data))
    const { subject } = result
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
    const careerSubjectIds = new Set((await findCareerSubjects(subject.careerId)).map((other) => other.id))
    if (requirements.requirementIds.some((id) => !careerSubjectIds.has(id))) {
      throw new DomainError('Las prelaciones deben ser materias de la misma carrera.')
    }

    await replaceSubjectRequirements(subjectId, requirements)
    const count = requirements.requirementIds.length
    return `Se guardaron ${count} ${count === 1 ? 'prelación' : 'prelaciones'} de ${subject.code}.`
  }, ['/admin/curriculum'])
}
