// Grade rules: who can receive a grade and when a section can be published.
import { DomainError } from '@/domain/shared/domain-error'

export function validateStudentInSection(enrolled: boolean) {
  if (!enrolled) throw new DomainError('El estudiante no está inscrito en esta sección.')
}

// A section is published as a whole, so every enrolled student needs a grade first.
export function validatePublishable(enrolledCount: number, gradedCount: number) {
  if (enrolledCount === 0) throw new DomainError('La sección no tiene estudiantes inscritos.')
  const missing = enrolledCount - gradedCount
  if (missing > 0) throw new DomainError(`Faltan ${missing} ${missing === 1 ? 'nota' : 'notas'} por cargar antes de publicar.`)
}

export const GRADE_LOCKED_MESSAGE = 'Las notas publicadas solo pueden ser modificadas por un administrador.'

// Once published, a grade can only be changed by an admin.
export function assertProfessorCanEdit(existing: { published: boolean } | null) {
  if (existing?.published) throw new DomainError(GRADE_LOCKED_MESSAGE)
}

// The admin correction applies to published grades; drafts belong to the professor.
export function assertAdminCanCorrect(existing: { published: boolean } | null) {
  if (!existing?.published) throw new DomainError('Solo se pueden corregir notas publicadas.')
}
