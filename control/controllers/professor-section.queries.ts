import 'server-only'
import { redirect } from 'next/navigation'
import { getProfessorContext } from '@/control/controllers/professor-context'
import { professorSectionIdSchema } from '@/control/validation/section-access.schema'
import { findSectionRoster, findSectionsByProfessor } from '@/data-access/repositories/professor-section.repository'
import { ownsSection } from '@/domain/grades/section-ownership'

const toMinutes = (time: Date) => time.getUTCHours() * 60 + time.getUTCMinutes()

function toBlocks(blocks: { weekday: string; startTime: Date; endTime: Date }[]) {
  return blocks.map((block) => ({ weekday: block.weekday, startMinutes: toMinutes(block.startTime), endMinutes: toMinutes(block.endTime) }))
}

// Sections of the signed-in professor in the term they work on.
export async function getMySections() {
  const { user, term } = await getProfessorContext()
  if (!term) return { termName: null, sections: [] }

  const sections = await findSectionsByProfessor(user.id, term.id)
  return {
    termName: term.name,
    sections: sections.map((section) => ({
      id: section.id,
      number: section.number,
      subject: section.subject,
      blocks: toBlocks(section.scheduleBlocks),
      enrolled: section._count.enrollmentDetails,
    })),
  }
}

export type ProfessorSection = Awaited<ReturnType<typeof getMySections>>['sections'][number]

// Student list of a section. Returns null for an unknown section and denies access to another professor's section.
export async function getMySectionRoster(rawSectionId: string) {
  const { user } = await getProfessorContext()
  const parsed = professorSectionIdSchema.safeParse(rawSectionId)
  if (!parsed.success) return null

  const section = await findSectionRoster(parsed.data)
  if (!section) return null
  if (!ownsSection(section, user.id)) redirect('/forbidden')

  return {
    id: section.id,
    number: section.number,
    subject: section.subject,
    termName: section.term.name,
    blocks: toBlocks(section.scheduleBlocks),
    students: section.enrollmentDetails.map(({ enrollment: { student } }) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      career: student.career?.name ?? null,
    })),
  }
}

export type SectionRoster = NonNullable<Awaited<ReturnType<typeof getMySectionRoster>>>
