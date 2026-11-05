'use server'

import { revalidatePath } from 'next/cache'
import { getDepartmentHeadContext } from '@/control/controllers/department-head-context'
import {
  addScheduleBlocksSchema,
  createSectionSchema,
  removeScheduleBlockSchema,
  sectionIdSchema,
  updateSectionSchema,
  type AddScheduleBlocksInput,
  type CreateSectionInput,
  type UpdateSectionInput,
} from '@/control/validation/section.schema'
import {
  addScheduleBlocksWithLock,
  createSection as insertSection,
  deleteSectionWithLock,
  findDepartmentSection,
  findSubjectInDepartment,
  findTermById,
  findUserRole,
  isUniqueViolation,
  removeScheduleBlockWithLock,
  updateSectionWithLock,
} from '@/data-access/repositories/section-management.repository'
import {
  nextSectionNumber,
  validateProfessor,
  validateSectionCapacity,
  validateSectionDeletable,
  validateSectionFound,
  validateSubjectInDepartment,
  validateTermEditable,
} from '@/domain/sections/section-rules'
import {
  buildWeeklyBlocks,
  describeBlock,
  parseClock,
  validateNoOverlapInSection,
  validateProfessorAvailability,
  validateScheduleChangeAllowed,
} from '@/domain/sections/schedule-rules'
import { DomainError } from '@/domain/shared/domain-error'

export interface SectionActionResult {
  ok: boolean
  message: string
  sectionId?: string
}

const NO_DEPARTMENT = 'Tu cuenta no tiene un departamento asignado. Solicita a la administración que te asigne uno.'

async function runSectionUseCase(useCase: () => Promise<SectionActionResult>): Promise<SectionActionResult> {
  try {
    const result = await useCase()
    revalidatePath('/department-head', 'layout')
    return result
  } catch (error) {
    if (error instanceof DomainError) return { ok: false, message: error.message }
    throw error
  }
}

async function requireDepartment() {
  const { department } = await getDepartmentHeadContext()
  if (!department) throw new DomainError(NO_DEPARTMENT)
  return department
}

// Creates a section of a department subject in an editable term, with its professor and capacity.
export async function createSection(input: CreateSectionInput): Promise<SectionActionResult> {
  const parsed = createSectionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }
  const data = parsed.data

  return runSectionUseCase(async () => {
    const department = await requireDepartment()
    const [term, subject, professor] = await Promise.all([
      findTermById(data.termId),
      findSubjectInDepartment(data.subjectId, department.id),
      findUserRole(data.professorId),
    ])
    validateTermEditable(term, new Date())
    validateSubjectInDepartment(subject)
    validateProfessor(professor)
    validateSectionCapacity(data.capacity)

    try {
      const section = await insertSection({ ...data, nextNumber: nextSectionNumber })
      return {
        ok: true,
        sectionId: section.id,
        message: `Se creó la sección ${section.number} de ${subject!.name} en el período ${term!.name}.`,
      }
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DomainError(
          data.number
            ? `Ya existe la sección ${data.number} de ${subject!.name} en el período ${term!.name}. Usa otro número o déjalo vacío para asignarlo automáticamente.`
            : 'Otra persona creó una sección de esta materia al mismo tiempo. Vuelve a intentarlo.',
        )
      }
      throw error
    }
  })
}

// Loads a section of the head's department in an editable term.
async function requireEditableSection(sectionId: string) {
  const department = await requireDepartment()
  const section = await findDepartmentSection(sectionId, department.id)
  validateSectionFound(section)
  validateTermEditable(section!.term, new Date())
  return section!
}

// Updates professor, capacity and number of a section; capacity can never drop below the enrolled students.
export async function updateSection(input: UpdateSectionInput): Promise<SectionActionResult> {
  const parsed = updateSectionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }
  const data = parsed.data

  return runSectionUseCase(async () => {
    const section = await requireEditableSection(data.sectionId)
    const professor = await findUserRole(data.professorId)
    validateProfessor(professor)

    try {
      const updated = await updateSectionWithLock({
        ...data,
        assertCapacity: validateSectionCapacity,
        assertProfessorAvailable: (professorBlocks, sectionBlocks) => validateProfessorAvailability(professor!.name, professorBlocks, sectionBlocks),
      })
      validateSectionFound(updated)
      return { ok: true, sectionId: section.id, message: `Se guardaron los cambios de la sección ${updated!.number} de ${section.subject.name}.` }
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DomainError(`Ya existe la sección ${data.number} de ${section.subject.name} en el período ${section.term.name}. Usa otro número.`)
      }
      throw error
    }
  })
}

// Deletes a section without enrolled students or grades; its schedule blocks are removed with it.
export async function deleteSection(rawSectionId: string): Promise<SectionActionResult> {
  const parsed = sectionIdSchema.safeParse(rawSectionId)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  return runSectionUseCase(async () => {
    const section = await requireEditableSection(parsed.data)
    const deleted = await deleteSectionWithLock(section.id, validateSectionDeletable)
    validateSectionFound(deleted || null)
    return { ok: true, message: `Se eliminó la sección ${section.number} de ${section.subject.name} del período ${section.term.name}.` }
  })
}

// Adds the same time range on one or more weekdays to a section without enrolled students, checking range, overlaps
// and professor availability for every block; either all blocks are stored or none.
export async function addScheduleBlocks(input: AddScheduleBlocksInput): Promise<SectionActionResult> {
  const parsed = addScheduleBlocksSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }
  const { sectionId, weekdays, start, end } = parsed.data

  return runSectionUseCase(async () => {
    const blocks = buildWeeklyBlocks(weekdays, parseClock(start)!, parseClock(end)!)
    const section = await requireEditableSection(sectionId)
    const created = await addScheduleBlocksWithLock({
      sectionId: section.id,
      blocks,
      assertAllowed: ({ occupied, ownBlocks, professorBlocks }) => {
        validateScheduleChangeAllowed(occupied)
        blocks.forEach((block) => validateNoOverlapInSection(ownBlocks, block))
        validateProfessorAvailability(section.professor.name, professorBlocks, blocks)
      },
    })
    validateSectionFound(created)
    const added = blocks.map(describeBlock).join(', ')
    return {
      ok: true,
      sectionId: section.id,
      message: `Se ${blocks.length === 1 ? 'agregó el bloque' : 'agregaron los bloques'} ${added} a la sección ${section.number}.`,
    }
  })
}

// Removes a weekly block from a section without enrolled students.
export async function removeScheduleBlock(input: { sectionId: string; blockId: string }): Promise<SectionActionResult> {
  const parsed = removeScheduleBlockSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  return runSectionUseCase(async () => {
    const section = await requireEditableSection(parsed.data.sectionId)
    const removed = await removeScheduleBlockWithLock({ ...parsed.data, assertAllowed: validateScheduleChangeAllowed })
    if (!removed) throw new DomainError('El bloque ya no existe. Recarga la página para ver el horario actual.')
    return { ok: true, sectionId: section.id, message: `Se quitó el bloque del horario de la sección ${section.number}.` }
  })
}
