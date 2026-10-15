import { prisma } from '@/data-access/prisma'

export const sectionInclude = {
  subject: true,
  professor: { select: { name: true } },
  scheduleBlocks: { orderBy: [{ weekday: 'asc' as const }, { startTime: 'asc' as const }] },
  _count: { select: { enrollmentDetails: true } },
}

export function findOfferByTerm(termId: string, careerId: string) {
  return prisma.section.findMany({
    where: { termId, subject: { careerId } },
    include: sectionInclude,
    orderBy: [{ subject: { term: 'asc' } }, { subject: { branch: 'asc' } }, { number: 'asc' }],
  })
}

export function findSectionById(sectionId: string) {
  return prisma.section.findUnique({ where: { id: sectionId }, include: sectionInclude })
}
