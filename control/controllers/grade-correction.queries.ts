import 'server-only'
import { requireRole } from '@/control/auth/session'
import { professorSectionIdSchema } from '@/control/validation/section-access.schema'
import { findPublishedSectionGrades, findSectionsWithPublishedGrades } from '@/data-access/repositories/grade-management.repository'
import { findTeachingTerm } from '@/data-access/repositories/professor-section.repository'
import { listTerms } from '@/data-access/repositories/term-management.repository'

// Sections with published grades of the requested term, or of the term in progress by default.
export async function getCorrectableSections(requestedTerm?: string) {
  await requireRole('ADMIN')
  const terms = await listTerms()
  const defaultTerm = await findTeachingTerm(new Date())
  const term = terms.find((item) => item.name === requestedTerm) ?? terms.find((item) => item.id === defaultTerm?.id) ?? null
  return {
    termNames: terms.map((item) => item.name),
    termName: term?.name ?? null,
    sections: term ? await findSectionsWithPublishedGrades(term.id) : [],
  }
}

// Published grades of a section; null when the id is malformed or the section does not exist.
export async function getCorrectableGrades(rawSectionId: string) {
  await requireRole('ADMIN')
  const parsed = professorSectionIdSchema.safeParse(rawSectionId)
  return parsed.success ? findPublishedSectionGrades(parsed.data) : null
}
