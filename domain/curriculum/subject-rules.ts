// Subject rules: valid data for a subject of the curriculum and its place on the grid.
import { CURRICULUM_BRANCHES, CURRICULUM_TERMS } from '@/domain/curriculum/curriculum-grid'
import { DomainError } from '@/domain/shared/domain-error'

export const SUBJECT_CODE_PATTERN = /^[A-Z]{2,7}\d{1,3}$/
export const SUBJECT_NAME_LENGTH = { min: 3, max: 100 }
export const SUBJECT_CREDITS = { min: 1, max: 10 }

export interface SubjectFields {
  code: string
  name: string
  credits: number
  term: number
  branch: number
}

export interface PlacedSubject {
  id: string
  code: string
  name: string
  term: number
  branch: number
}

const isIntegerBetween = (value: number, min: number, max: number) => Number.isInteger(value) && value >= min && value <= max

// Every problem of the fields of a subject, in the order the form shows them.
export function validateSubjectFields(subject: SubjectFields) {
  const errors: string[] = []
  if (!subject.code) errors.push('El código es obligatorio.')
  else if (!SUBJECT_CODE_PATTERN.test(subject.code)) errors.push(`El código ${subject.code} debe tener letras seguidas de números, por ejemplo FPTSP07.`)
  if (!subject.name) errors.push('El nombre es obligatorio.')
  else if (subject.name.length < SUBJECT_NAME_LENGTH.min || subject.name.length > SUBJECT_NAME_LENGTH.max) {
    errors.push(`El nombre debe tener entre ${SUBJECT_NAME_LENGTH.min} y ${SUBJECT_NAME_LENGTH.max} caracteres.`)
  }
  if (!isIntegerBetween(subject.credits, SUBJECT_CREDITS.min, SUBJECT_CREDITS.max)) {
    errors.push(`Las UC deben ser un número entero entre ${SUBJECT_CREDITS.min} y ${SUBJECT_CREDITS.max}.`)
  }
  if (!isIntegerBetween(subject.term, 1, CURRICULUM_TERMS)) errors.push(`El trimestre debe estar entre 1 y ${CURRICULUM_TERMS}.`)
  if (!isIntegerBetween(subject.branch, 1, CURRICULUM_BRANCHES)) errors.push(`La rama debe estar entre 1 y ${CURRICULUM_BRANCHES}.`)
  return errors
}

// Problems placing a subject among the other subjects of its career: repeated code or occupied cell.
export function validateSubjectPlacement(subjects: PlacedSubject[], candidate: SubjectFields, ignoreId?: string) {
  const others = subjects.filter((subject) => subject.id !== ignoreId)
  const errors: string[] = []
  const sameCode = others.find((subject) => subject.code === candidate.code)
  if (sameCode) errors.push(`El código ${candidate.code} ya pertenece a ${sameCode.name}.`)
  const sameCell = others.find((subject) => subject.term === candidate.term && subject.branch === candidate.branch)
  if (sameCell) errors.push(`El trimestre ${candidate.term}, rama ${candidate.branch} ya tiene la materia ${sameCell.code}.`)
  return errors
}

export function assertValidSubject(subjects: PlacedSubject[], candidate: SubjectFields, ignoreId?: string) {
  const errors = [...validateSubjectFields(candidate), ...validateSubjectPlacement(subjects, candidate, ignoreId)]
  if (errors.length) throw new DomainError(errors.join(' '))
}
