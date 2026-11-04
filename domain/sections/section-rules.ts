// Section management rules for the department head: editable terms, professor eligibility and capacity limits.
import { DomainError } from '@/domain/shared/domain-error'

export const MAX_SECTION_CAPACITY = 200

// A term can receive section changes until its last day.
export function isTermEditable(term: { endsAt: Date }, today: Date) {
  const lastDay = new Date(Date.UTC(term.endsAt.getUTCFullYear(), term.endsAt.getUTCMonth(), term.endsAt.getUTCDate(), 23, 59, 59))
  return today.getTime() <= lastDay.getTime()
}

export function validateTermEditable(term: { name: string; endsAt: Date } | null, today: Date) {
  if (!term) throw new DomainError('El período seleccionado no existe. Recarga la página y elige otro período.')
  if (!isTermEditable(term, today)) {
    throw new DomainError(`El período ${term.name} ya finalizó y sus secciones no se pueden modificar. Elige un período vigente o futuro.`)
  }
}

export function validateSubjectInDepartment(subject: { id: string } | null) {
  if (!subject) throw new DomainError('La materia no pertenece a las carreras de tu departamento. Elige una materia de la lista.')
}

export function validateProfessor(professor: { role: string; active: boolean } | null) {
  if (!professor || professor.role !== 'PROFESSOR') {
    throw new DomainError('El profesor seleccionado no existe. Elige un profesor de la lista.')
  }
  if (!professor.active) throw new DomainError('El profesor seleccionado está inactivo. Elige un profesor activo.')
}

// Capacity must be between 1 and the maximum, and never below the seats already taken.
export function validateSectionCapacity(capacity: number, occupied = 0) {
  if (!Number.isInteger(capacity) || capacity < 1) throw new DomainError('El cupo debe ser un número entero mayor que cero.')
  if (capacity > MAX_SECTION_CAPACITY) throw new DomainError(`El cupo no puede superar ${MAX_SECTION_CAPACITY} estudiantes.`)
  if (capacity < occupied) {
    throw new DomainError(`La sección ya tiene ${occupied} inscritos. El cupo no puede ser menor que ${occupied}.`)
  }
}

// Next free section number for a subject in a term.
export function nextSectionNumber(existingNumbers: number[]) {
  return existingNumbers.length ? Math.max(...existingNumbers) + 1 : 1
}
