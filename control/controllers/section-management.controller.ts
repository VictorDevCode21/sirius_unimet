'use server'

import { revalidatePath } from 'next/cache'
import { getDepartmentHeadContext } from '@/control/controllers/department-head-context'
import {
  createSectionSchema,
  sectionIdSchema,
  updateSectionSchema,
  type CreateSectionInput,
  type UpdateSectionInput,
} from '@/control/validation/section.schema'
import {
  createSection as insertSection,
  deleteSectionWithLock,
  findDepartmentSection,
  findSubjectInDepartment,
  findTermById,
  findUserRole,
  isUniqueViolation,
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
    validateProfessor(await findUserRole(data.professorId))

    try {
      const updated = await updateSectionWithLock({ ...data, assertCapacity: validateSectionCapacity })
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
