import { prisma } from '@/data-access/prisma'
import { SEAT_HOLDING_STATUS } from '@/data-access/repositories/seat.repository'

export const sectionInclude = {
  subject: true,
  professor: { select: { name: true } },
  scheduleBlocks: { orderBy: [{ weekday: 'asc' as const }, { startTime: 'asc' as const }] },
  // Seats taken: only confirmed enrollments hold a seat.
  _count: { select: { enrollmentDetails: { where: { enrollment: { status: SEAT_HOLDING_STATUS } } } } },
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
