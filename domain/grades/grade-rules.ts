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
