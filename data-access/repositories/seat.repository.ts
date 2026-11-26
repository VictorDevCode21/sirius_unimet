import type { Prisma, PrismaClient } from '@/data-access/generated/prisma/client'
import type { AlternativeSection, SelectedSeat } from '@/domain/enrollment/seat-rules'

// Seat data as stored: the enrollment status of every detail that may hold a seat, counted by the seat rules.
export type SeatRecord = Omit<SelectedSeat, 'taken'> & { holderStatuses: string[] }
export type AlternativeRecord = Omit<AlternativeSection, 'taken'> & { holderStatuses: string[] }

const holderStatuses = (details: { enrollment: { status: string } }[]) => details.map((detail) => detail.enrollment.status)

export type DbClient = PrismaClient | Prisma.TransactionClient

const toMinutes = (time: Date) => time.getUTCHours() * 60 + time.getUTCMinutes()

const toBlocks = (blocks: { weekday: string; startTime: Date; endTime: Date }[]) =>
  blocks.map((block) => ({ weekday: block.weekday, startMinutes: toMinutes(block.startTime), endMinutes: toMinutes(block.endTime) }))

// Seats of every section in an enrollment, with the enrollment status of every other student's detail.
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
      enrollmentDetails: { where: { enrollmentId: { not: enrollmentId } }, select: { enrollment: { select: { status: true } } } },
    },
    orderBy: { id: 'asc' },
  })

  const seats: SeatRecord[] = sections.map((section) => ({
    sectionId: section.id,
    sectionNumber: section.number,
    subjectId: section.subject.id,
    subjectName: section.subject.name,
    capacity: section.capacity,
    holderStatuses: holderStatuses(section.enrollmentDetails),
    blocks: toBlocks(section.scheduleBlocks),
  }))
  return { termId: enrollment.termId, seats }
}

// Other sections of the given subjects in a term, with the enrollment status of each detail, grouped by subject.
export async function loadAlternativeSections(client: DbClient, termId: string, subjectIds: string[], excludeSectionIds: string[]) {
  const sections = await client.section.findMany({
    where: { termId, subjectId: { in: subjectIds }, id: { notIn: excludeSectionIds } },
    include: {
      professor: { select: { name: true } },
      scheduleBlocks: true,
      enrollmentDetails: { select: { enrollment: { select: { status: true } } } },
    },
    orderBy: { number: 'asc' },
  })

  const bySubject = new Map<string, AlternativeRecord[]>()
  for (const section of sections) {
    const alternative: AlternativeRecord = {
      sectionId: section.id,
      number: section.number,
      professor: section.professor.name,
      capacity: section.capacity,
      holderStatuses: holderStatuses(section.enrollmentDetails),
      blocks: toBlocks(section.scheduleBlocks),
    }
    bySubject.set(section.subjectId, [...(bySubject.get(section.subjectId) ?? []), alternative])
  }
  return bySubject
}
