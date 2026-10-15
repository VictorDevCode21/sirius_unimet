// Grades service rules: derives the academic progress of a student from published grades.
import type { AcademicProgress } from '@/domain/prerequisites/prerequisite-engine'

export const PASSING_GRADE = 10

export interface PublishedGrade {
  subjectId: string
  code: string
  credits: number
  value: number
  passed: boolean
}

export function buildAcademicProgress(grades: PublishedGrade[], inProgressSubjectIds: string[]): AcademicProgress {
  const passed = grades.filter((grade) => grade.passed)
  const passedSubjectIds = new Set(passed.map((grade) => grade.subjectId))
  const passedCredits = [...passedSubjectIds].reduce(
    (sum, id) => sum + (passed.find((grade) => grade.subjectId === id)?.credits ?? 0),
    0,
  )
  return {
    passedSubjectIds,
    inProgressSubjectIds: new Set(inProgressSubjectIds.filter((id) => !passedSubjectIds.has(id))),
    passedCredits,
    passedCreditsByCode: new Map(passed.map((grade) => [grade.code, grade.credits])),
  }
}

// Credit-weighted average over every graded subject, on the 0–20 scale.
export function weightedAverage(grades: { value: number; credits: number }[]) {
  const totalCredits = grades.reduce((sum, grade) => sum + grade.credits, 0)
  if (!totalCredits) return null
  return grades.reduce((sum, grade) => sum + grade.value * grade.credits, 0) / totalCredits
}

export function resolveGradeStatus(value: number) {
  if (!Number.isInteger(value) || value < 0 || value > 20) throw new RangeError('Grade must be an integer between 0 and 20')
  return value >= PASSING_GRADE ? 'PASSED' : 'FAILED'
}
