'use server'

import { requireRole } from '@/control/auth/session'
import { runAction, type ActionResult } from '@/control/controllers/action-result'
import { saveGradeSchema } from '@/control/validation/grade.schema'
import { professorSectionIdSchema } from '@/control/validation/section-access.schema'
import { findSectionOwner, publishSectionGrades, saveGrade as storeGrade } from '@/data-access/repositories/grade-management.repository'
import { resolveGradeStatus } from '@/domain/grades/academic-progress'
import { validatePublishable, validateStudentInSection } from '@/domain/grades/grade-rules'
import { assertOwnsSection } from '@/domain/grades/section-ownership'
import { DomainError } from '@/domain/shared/domain-error'

const SECTION_NOT_FOUND = 'La sección no existe. Recarga la página.'

async function assertProfessorOwnsSection(sectionId: string, professorId: string) {
  const section = await findSectionOwner(sectionId)
  if (!section) throw new DomainError(SECTION_NOT_FOUND)
  assertOwnsSection(section, professorId)
}

// Saves the final grade of a student in one of the professor's sections.
export async function saveGrade(input: { sectionId: string; studentId: string; value: string }): Promise<ActionResult> {
  const professor = await requireRole('PROFESSOR')
  const parsed = saveGradeSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  return runAction(async () => {
    const { sectionId, studentId, value } = parsed.data
    await assertProfessorOwnsSection(sectionId, professor.id)
    await storeGrade({ sectionId, studentId, value, status: resolveGradeStatus(value) }, validateStudentInSection)
    return 'Nota guardada.'
  }, ['/professor'])
}

// Publishes the grades of a section, which makes them visible in the student history.
export async function publishGrades(rawSectionId: string): Promise<ActionResult> {
  const professor = await requireRole('PROFESSOR')
  const parsed = professorSectionIdSchema.safeParse(rawSectionId)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  return runAction(async () => {
    await assertProfessorOwnsSection(parsed.data, professor.id)
    await publishSectionGrades(parsed.data, validatePublishable)
    return 'Notas publicadas. Los estudiantes ya pueden verlas en su histórico.'
  }, ['/professor', '/student'])
}
