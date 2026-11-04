'use server'

import { revalidatePath } from 'next/cache'
import { getDepartmentHeadContext } from '@/control/controllers/department-head-context'
import { createSectionSchema, type CreateSectionInput } from '@/control/validation/section.schema'
import {
  createSection as insertSection,
  findSubjectInDepartment,
  findTermById,
  findUserRole,
  isUniqueViolation,
} from '@/data-access/repositories/section-management.repository'
import { nextSectionNumber, validateProfessor, validateSectionCapacity, validateSubjectInDepartment, validateTermEditable } from '@/domain/sections/section-rules'
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
