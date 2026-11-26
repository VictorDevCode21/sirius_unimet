import { prisma } from '@/data-access/prisma'

// Only confirmed enrollments count: a pre-enrolled student has not paid and is not attending the section.
const confirmedDetail = { enrollment: { status: 'CONFIRMED' as const } }

const scheduleOrder = [{ weekday: 'asc' as const }, { startTime: 'asc' as const }]

// Term a professor works on: the one in progress or, between terms, the latest one that started, because final
// grades are uploaded after a term ends.
export async function findTeachingTerm(today: Date) {
  const current = await prisma.term.findFirst({ where: { startsAt: { lte: today }, endsAt: { gte: today } } })
  return current ?? prisma.term.findFirst({ where: { startsAt: { lte: today } }, orderBy: { startsAt: 'desc' } })
}

export function findSectionsByProfessor(professorId: string, termId: string) {
  return prisma.section.findMany({
    where: { professorId, termId },
    include: {
      subject: { select: { code: true, name: true } },
      scheduleBlocks: { orderBy: scheduleOrder },
      _count: { select: { enrollmentDetails: { where: confirmedDetail } } },
    },
    orderBy: [{ subject: { name: 'asc' } }, { number: 'asc' }],
  })
}

export function findSectionRoster(sectionId: string) {
  return prisma.section.findUnique({
    where: { id: sectionId },
    include: {
      subject: { select: { code: true, name: true } },
      term: { select: { name: true } },
      scheduleBlocks: { orderBy: scheduleOrder },
      enrollmentDetails: {
        where: confirmedDetail,
        select: {
          enrollment: {
            select: { student: { select: { id: true, name: true, email: true, career: { select: { name: true } } } } },
          },
        },
        orderBy: { enrollment: { student: { name: 'asc' } } },
      },
    },
  })
}
