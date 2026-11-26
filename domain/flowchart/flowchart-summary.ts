// Flowchart summary: status counts, credit progress and the curriculum term where the student currently is.
import type { SubjectStatus } from '@/domain/prerequisites/prerequisite-engine'

export const CURRICULUM_TERMS = 12
export const CURRICULUM_BRANCHES = 5

export const SUBJECT_STATUSES: SubjectStatus[] = ['PASSED', 'IN_PROGRESS', 'AVAILABLE', 'BLOCKED']

export interface SummarizableSubject {
  id: string
  credits: number
  term: number
  status: SubjectStatus
}

export interface PassingGrade {
  value: number
  termName: string
}

export function countByStatus(subjects: { status: SubjectStatus }[]): Record<SubjectStatus, number> {
  const counts = Object.fromEntries(SUBJECT_STATUSES.map((status) => [status, 0])) as Record<SubjectStatus, number>
  for (const subject of subjects) counts[subject.status]++
  return counts
}

// The curriculum term of the subjects in progress, or the term right after the last passed subject.
export function resolveCurrentCurriculumTerm(subjects: SummarizableSubject[]) {
  const inProgressTerms = subjects.filter((subject) => subject.status === 'IN_PROGRESS').map((subject) => subject.term)
  if (inProgressTerms.length) return Math.max(...inProgressTerms)
  const passedTerms = subjects.filter((subject) => subject.status === 'PASSED').map((subject) => subject.term)
  return Math.min(CURRICULUM_TERMS, Math.max(0, ...passedTerms) + 1)
}

export function summarizeFlowchart(subjects: SummarizableSubject[], passedCredits: number) {
  const planCredits = subjects.reduce((sum, subject) => sum + subject.credits, 0)
  const statusCounts = countByStatus(subjects)
  return {
    planCredits,
    passedCredits,
    passedSubjects: statusCounts.PASSED,
    totalSubjects: subjects.length,
    progressPercent: planCredits ? Math.min(100, (passedCredits / planCredits) * 100) : 0,
    currentCurriculumTerm: resolveCurrentCurriculumTerm(subjects),
    statusCounts,
  }
}

// Highest passing grade of each subject, with the term where it was obtained.
export function passingGradesBySubject(grades: { subjectId: string; value: number; passed: boolean; termName: string }[]) {
  const bySubject = new Map<string, PassingGrade>()
  for (const grade of grades) {
    if (!grade.passed) continue
    const current = bySubject.get(grade.subjectId)
    if (!current || grade.value > current.value) bySubject.set(grade.subjectId, { value: grade.value, termName: grade.termName })
  }
  return bySubject
}
