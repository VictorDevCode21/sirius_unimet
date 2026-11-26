import 'server-only'
import { getStudentContext } from '@/control/controllers/student-context'
import { describeRequirement, nextBlockedSubjects, pendingRequirements } from '@/domain/flowchart/pending-requirements'
import { passingGradesBySubject, summarizeFlowchart } from '@/domain/flowchart/flowchart-summary'
import { markFailedSubjects } from '@/domain/grades/course-outcome'

export { CURRICULUM_BRANCHES, CURRICULUM_TERMS } from '@/domain/flowchart/flowchart-summary'

// Flowchart controller: student flowchart with the status, prerequisites, pending requirements and passing grade of
// every subject, and whether its published attempts are all failed.
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
  const subjects = markFailedSubjects(
    states.map((subject) => ({
      ...subject,
      passingGrade: passingGrades.get(subject.id) ?? null,
      requirements: subject.requirements.map((requirement) => ({ ...requirement, label: describeRequirement(requirement) })),
      pendingRequirements: pendingRequirements(subject),
    })),
    grades.map((grade) => ({ subjectId: grade.section.subjectId, passed: grade.status === 'PASSED' })),
  )

  const stats = summarizeFlowchart(subjects, progress.passedCredits)

  return {
    career: profile.career,
    currentTerm,
    subjects,
    stats,
    nextBlocked: nextBlockedSubjects(subjects, stats.currentCurriculumTerm),
  }
}

export type Flowchart = Awaited<ReturnType<typeof getFlowchart>>
export type FlowchartSubject = Flowchart['subjects'][number]
