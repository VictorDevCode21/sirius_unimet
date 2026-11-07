import type { Prisma, PrismaClient } from '@/data-access/generated/prisma/client'
import type { AlternativeSection, SelectedSeat } from '@/domain/enrollment/seat-rules'

// Enrollment status whose sections hold a seat; pre-enrolled and pending enrollments do not.
export const SEAT_HOLDING_STATUS = 'CONFIRMED' as const

export type DbClient = PrismaClient | Prisma.TransactionClient

const toMinutes = (time: Date) => time.getUTCHours() * 60 + time.getUTCMinutes()

const toBlocks = (blocks: { weekday: string; startTime: Date; endTime: Date }[]) =>
  blocks.map((block) => ({ weekday: block.weekday, startMinutes: toMinutes(block.startTime), endMinutes: toMinutes(block.endTime) }))

// Seats of every section in an enrollment, counting the confirmed enrollments of other students.
// With `lock`, the section rows are locked (FOR UPDATE, in id order to avoid deadlocks) until the caller's
// transaction ends, so two confirmations can never take the same last seat.
export async function loadSelectedSeats(client: DbClient, enrollmentId: string, options: { lock: boolean }) {
  const enrollment = await client.enrollment.findUniqueOrThrow({
    where: { id: enrollmentId },
    select: { termId: true, details: { select: { sectionId: true } } },
  })
  const sectionIds = enrollment.details.map((detail) => detail.sectionId).sort()
  if (options.lock && sectionIds.length) {
    await client.$queryRaw`SELECT "id" FROM "Section" WHERE "id" = ANY(${sectionIds}::uuid[]) ORDER BY "id" FOR UPDATE`
  }

  const sections = await client.section.findMany({
    where: { id: { in: sectionIds } },
    include: {
      subject: { select: { id: true, name: true } },
      scheduleBlocks: true,
      _count: {
        select: {
          enrollmentDetails: { where: { enrollmentId: { not: enrollmentId }, enrollment: { status: SEAT_HOLDING_STATUS } } },
        },
      },
    },
    orderBy: { id: 'asc' },
  })

  const seats: SelectedSeat[] = sections.map((section) => ({
    sectionId: section.id,
    sectionNumber: section.number,
    subjectId: section.subject.id,
    subjectName: section.subject.name,
    capacity: section.capacity,
    taken: section._count.enrollmentDetails,
    blocks: toBlocks(section.scheduleBlocks),
  }))
  return { termId: enrollment.termId, seats }
}

// Other sections of the given subjects in a term, with their confirmed seats, grouped by subject.
export async function loadAlternativeSections(client: DbClient, termId: string, subjectIds: string[], excludeSectionIds: string[]) {
  const sections = await client.section.findMany({
    where: { termId, subjectId: { in: subjectIds }, id: { notIn: excludeSectionIds } },
    include: {
      professor: { select: { name: true } },
      scheduleBlocks: true,
      _count: { select: { enrollmentDetails: { where: { enrollment: { status: SEAT_HOLDING_STATUS } } } } },
    },
    orderBy: { number: 'asc' },
  })

  const bySubject = new Map<string, AlternativeSection[]>()
  for (const section of sections) {
    const alternative: AlternativeSection = {
      sectionId: section.id,
      number: section.number,
      professor: section.professor.name,
      capacity: section.capacity,
      taken: section._count.enrollmentDetails,
      blocks: toBlocks(section.scheduleBlocks),
    }
    bySubject.set(section.subjectId, [...(bySubject.get(section.subjectId) ?? []), alternative])
  }
  return bySubject
}
