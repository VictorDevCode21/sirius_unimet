import 'server-only'
import { getStudentContext } from '@/control/controllers/student-context'

export const CURRICULUM_TERMS = 12
export const CURRICULUM_BRANCHES = 5

// Flowchart controller: student flowchart with the status and prerequisites of every subject.
export async function getFlowchart() {
  const { profile, subjects, progress, currentTerm } = await getStudentContext()
  const planCredits = subjects.reduce((sum, subject) => sum + subject.credits, 0)
  const passed = subjects.filter((subject) => subject.status === 'PASSED')
  const inProgressTerms = subjects.filter((subject) => subject.status === 'IN_PROGRESS').map((subject) => subject.term)
  const currentCurriculumTerm = inProgressTerms.length
    ? Math.max(...inProgressTerms)
    : Math.min(CURRICULUM_TERMS, Math.max(0, ...passed.map((subject) => subject.term)) + 1)

  return {
    career: profile.career,
    currentTerm,
    subjects,
    stats: {
      planCredits,
      passedCredits: progress.passedCredits,
      passedSubjects: passed.length,
      totalSubjects: subjects.length,
      progressPercent: planCredits ? (progress.passedCredits / planCredits) * 100 : 0,
      currentCurriculumTerm,
    },
  }
}

export type Flowchart = Awaited<ReturnType<typeof getFlowchart>>
export type FlowchartSubject = Flowchart['subjects'][number]
