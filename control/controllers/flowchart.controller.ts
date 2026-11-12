import 'server-only'
import { getStudentContext } from '@/control/controllers/student-context'
import { pendingRequirements } from '@/domain/flowchart/pending-requirements'
import { passingGradesBySubject, summarizeFlowchart } from '@/domain/flowchart/flowchart-summary'

export { CURRICULUM_BRANCHES, CURRICULUM_TERMS } from '@/domain/flowchart/flowchart-summary'

// Flowchart controller: student flowchart with the status, prerequisites, pending requirements and passing grade of
// every subject.
export async function getFlowchart() {
  const { profile, subjects: states, progress, currentTerm, grades } = await getStudentContext()
  const passingGrades = passingGradesBySubject(
    grades.map((grade) => ({
      subjectId: grade.section.subjectId,
      value: grade.value,
      passed: grade.status === 'PASSED',
      termName: grade.section.term.name,
    })),
  )
  const subjects = states.map((subject) => ({
    ...subject,
    passingGrade: passingGrades.get(subject.id) ?? null,
    pendingRequirements: pendingRequirements(subject),
  }))

  return {
    career: profile.career,
    currentTerm,
    subjects,
    stats: summarizeFlowchart(subjects, progress.passedCredits),
  }
}

export type Flowchart = Awaited<ReturnType<typeof getFlowchart>>
export type FlowchartSubject = Flowchart['subjects'][number]
