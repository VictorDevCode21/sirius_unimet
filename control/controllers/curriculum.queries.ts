import 'server-only'
import { requireRole } from '@/control/auth/session'
import { findCareer, findCareerSubjects, listCareers } from '@/data-access/repositories/curriculum-management.repository'

// Curriculum editor of the admin portal: careers to choose from and the subjects of the selected career.
export async function getCurriculumEditor(careerId?: string) {
  await requireRole('ADMIN')
  const careers = await listCareers()
  const career = (careerId ? await findCareer(careerId) : null) ?? careers[0] ?? null
  const subjects = career ? await findCareerSubjects(career.id) : []
  return {
    careers,
    career,
    subjects: subjects.map((subject) => ({
      id: subject.id,
      code: subject.code,
      name: subject.name,
      credits: subject.credits,
      term: subject.term,
      branch: subject.branch,
      minCredits: subject.minCredits,
      alternativeCredits: subject.alternativeCredits,
      alternativeCreditBlock: subject.alternativeCreditBlock,
      prerequisiteIds: subject.prerequisites.map((prerequisite) => prerequisite.requirementId),
    })),
  }
}

export type CurriculumEditor = Awaited<ReturnType<typeof getCurriculumEditor>>
export type EditorSubject = CurriculumEditor['subjects'][number]
