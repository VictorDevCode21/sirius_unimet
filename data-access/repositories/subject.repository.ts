import { prisma } from '@/data-access/prisma'
import type { CurriculumSubject } from '@/domain/prerequisites/prerequisite-engine'

export async function findCurriculumByCareer(careerId: string): Promise<CurriculumSubject[]> {
  const subjects = await prisma.subject.findMany({
    where: { careerId },
    include: { prerequisites: { select: { requirementId: true } } },
    orderBy: [{ term: 'asc' }, { branch: 'asc' }],
  })
  return subjects.map((subject) => ({
    id: subject.id,
    code: subject.code,
    name: subject.name,
    credits: subject.credits,
    term: subject.term,
    branch: subject.branch,
    minCredits: subject.minCredits,
    prerequisiteIds: subject.prerequisites.map((prerequisite) => prerequisite.requirementId),
    alternative:
      subject.alternativeCredits && subject.alternativeCreditBlock
        ? { credits: subject.alternativeCredits, block: subject.alternativeCreditBlock }
        : null,
  }))
}
