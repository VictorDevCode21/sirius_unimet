// Prerequisite service: computes the status of every subject of the student's curriculum.
import { buildAcademicProgress } from '@/domain/grades/academic-progress'
import { resolveSubjectStates } from '@/domain/prerequisites/prerequisite-engine'
import { findInProgressSubjectIds } from '@/data-access/repositories/enrollment.repository'
import { findPublishedGradesByStudent } from '@/data-access/repositories/grade.repository'
import { findCurriculumByCareer } from '@/data-access/repositories/subject.repository'
import { findTermByDate } from '@/data-access/repositories/term.repository'

export async function getSubjectStates(studentId: string, careerId: string, today = new Date()) {
  const [curriculum, grades, currentTerm] = await Promise.all([
    findCurriculumByCareer(careerId),
    findPublishedGradesByStudent(studentId),
    findTermByDate(today),
  ])
  const inProgressSubjectIds = currentTerm ? await findInProgressSubjectIds(studentId, currentTerm.id) : []
  const progress = buildAcademicProgress(
    grades.map((grade) => ({
      subjectId: grade.section.subjectId,
      code: grade.section.subject.code,
      credits: grade.section.subject.credits,
      value: grade.value,
      passed: grade.status === 'PASSED',
    })),
    inProgressSubjectIds,
  )

  return { subjects: resolveSubjectStates(curriculum, progress), progress, grades, currentTerm }
}
