// Section ownership: a professor only reaches the sections assigned to them.
import { DomainError } from '@/domain/shared/domain-error'

export function ownsSection(section: { professorId: string }, professorId: string) {
  return section.professorId === professorId
}

export function assertOwnsSection(section: { professorId: string }, professorId: string) {
  if (!ownsSection(section, professorId)) throw new DomainError('Esta sección pertenece a otro profesor.')
}
