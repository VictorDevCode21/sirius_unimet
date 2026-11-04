import { prisma } from '@/data-access/prisma'
import { Prisma } from '@/data-access/generated/prisma/client'
import type { Weekday } from '@/data-access/generated/prisma/enums'

// True when the error is a unique constraint violation (P2002).
export function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

export function findDepartmentByHead(headId: string) {
  return prisma.department.findUnique({
    where: { headId },
    select: { id: true, name: true, careers: { select: { id: true, name: true }, orderBy: { name: 'asc' } } },
  })
}

export function listTerms() {
  return prisma.term.findMany({ orderBy: { startsAt: 'desc' }, select: { id: true, name: true, startsAt: true, endsAt: true, open: true } })
}

export function findTermById(termId: string) {
  return prisma.term.findUnique({ where: { id: termId }, select: { id: true, name: true, startsAt: true, endsAt: true, open: true } })
}

export function listDepartmentSubjects(departmentId: string) {
  return prisma.subject.findMany({
    where: { career: { departmentId } },
    select: { id: true, code: true, name: true, credits: true, term: true, career: { select: { name: true } } },
    orderBy: [{ career: { name: 'asc' } }, { term: 'asc' }, { branch: 'asc' }],
  })
}

export function findSubjectInDepartment(subjectId: string, departmentId: string) {
  return prisma.subject.findFirst({ where: { id: subjectId, career: { departmentId } }, select: { id: true, code: true, name: true } })
}

export function listActiveProfessors() {
  return prisma.user.findMany({ where: { role: 'PROFESSOR', active: true }, select: { id: true, name: true, email: true }, orderBy: { name: 'asc' } })
}

export function findUserRole(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, role: true, active: true } })
}

export const managedSectionInclude = {
  subject: { select: { id: true, code: true, name: true, credits: true, career: { select: { name: true } } } },
  term: { select: { id: true, name: true, endsAt: true } },
  professor: { select: { id: true, name: true } },
  scheduleBlocks: { orderBy: [{ weekday: 'asc' as const }, { startTime: 'asc' as const }] },
  enrollmentDetails: { select: { enrollment: { select: { status: true } } } },
  _count: { select: { enrollmentDetails: true, grades: true } },
}

export function listDepartmentSections(departmentId: string, termId: string) {
  return prisma.section.findMany({
    where: { termId, subject: { career: { departmentId } } },
    include: managedSectionInclude,
    orderBy: [{ subject: { career: { name: 'asc' } } }, { subject: { term: 'asc' } }, { subject: { branch: 'asc' } }, { number: 'asc' }],
  })
}

export function findDepartmentSection(sectionId: string, departmentId: string) {
  return prisma.section.findFirst({ where: { id: sectionId, subject: { career: { departmentId } } }, include: managedSectionInclude })
}

// Students holding a seat in a section, with the status of their enrollment.
export function listSectionStudents(sectionId: string) {
  return prisma.enrollmentDetail.findMany({
    where: { sectionId },
    select: {
      createdAt: true,
      enrollment: { select: { status: true, student: { select: { id: true, name: true, email: true, career: { select: { name: true } } } } } },
    },
    orderBy: { enrollment: { student: { name: 'asc' } } },
  })
}

// Creates a section; when no number is given, the next free number of the subject in the term is used.
export function createSection(params: {
  subjectId: string
  termId: string
  professorId: string
  capacity: number
  number?: number
  nextNumber: (existing: number[]) => number
}) {
  return prisma.$transaction(async (tx) => {
    let number = params.number
    if (number === undefined) {
      const existing = await tx.section.findMany({ where: { subjectId: params.subjectId, termId: params.termId }, select: { number: true } })
      number = params.nextNumber(existing.map((section) => section.number))
    }
    return tx.section.create({
      data: { subjectId: params.subjectId, termId: params.termId, professorId: params.professorId, capacity: params.capacity, number },
      select: { id: true, number: true },
    })
  })
}

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

interface LockedBlock {
  weekday: string
  startMinutes: number
  endMinutes: number
}

interface LockedProfessorBlock extends LockedBlock {
  subjectName: string
  sectionNumber: number
}

const toMinutes = (time: Date) => time.getUTCHours() * 60 + time.getUTCMinutes()
const timeOf = (minutes: number) => new Date(Date.UTC(1970, 0, 1, Math.floor(minutes / 60), minutes % 60))

// Locks the section row (and the professor row that teaches it) so seat assignment, edits, schedule changes and
// deletion run one at a time; returns the counts and blocks needed to validate the change.
async function lockSection(tx: TransactionClient, sectionId: string, professorId?: string) {
  const [locked] = await tx.$queryRaw<{ professorId: string; termId: string }[]>`
    SELECT "professorId", "termId" FROM "Section" WHERE "id" = ${sectionId}::uuid FOR UPDATE`
  if (!locked) return null
  const teacherId = professorId ?? locked.professorId
  await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${teacherId}::uuid FOR UPDATE`

  const occupied = await tx.enrollmentDetail.count({ where: { sectionId } })
  const grades = await tx.grade.count({ where: { sectionId } })
  const ownBlocks = await tx.scheduleBlock.findMany({ where: { sectionId } })
  const teacherBlocks = await tx.scheduleBlock.findMany({
    where: { section: { professorId: teacherId, termId: locked.termId, id: { not: sectionId } } },
    include: { section: { select: { number: true, subject: { select: { name: true } } } } },
  })

  return {
    occupied,
    grades,
    ownBlocks: ownBlocks.map((block): LockedBlock & { id: string } => ({
      id: block.id,
      weekday: block.weekday,
      startMinutes: toMinutes(block.startTime),
      endMinutes: toMinutes(block.endTime),
    })),
    professorBlocks: teacherBlocks.map(
      (block): LockedProfessorBlock => ({
        weekday: block.weekday,
        startMinutes: toMinutes(block.startTime),
        endMinutes: toMinutes(block.endTime),
        subjectName: block.section.subject.name,
        sectionNumber: block.section.number,
      }),
    ),
  }
}

// Updates professor, capacity and number while holding the section lock; the capacity is checked against
// the seats taken at that moment and the professor against their other blocks in the term.
export function updateSectionWithLock(params: {
  sectionId: string
  professorId: string
  capacity: number
  number: number
  assertCapacity: (capacity: number, occupied: number) => void
  assertProfessorAvailable?: (professorBlocks: LockedProfessorBlock[], sectionBlocks: LockedBlock[]) => void
}) {
  return prisma.$transaction(async (tx) => {
    const locked = await lockSection(tx, params.sectionId, params.professorId)
    if (!locked) return null
    params.assertCapacity(params.capacity, locked.occupied)
    params.assertProfessorAvailable?.(locked.professorBlocks, locked.ownBlocks)
    return tx.section.update({
      where: { id: params.sectionId },
      data: { professorId: params.professorId, capacity: params.capacity, number: params.number },
      select: { id: true, number: true, capacity: true },
    })
  })
}

// Deletes a section and its schedule blocks only when the rule allows it at the moment of the lock.
export function deleteSectionWithLock(sectionId: string, assertDeletable: (occupied: number, grades: number) => void) {
  return prisma.$transaction(async (tx) => {
    const locked = await lockSection(tx, sectionId)
    if (!locked) return false
    assertDeletable(locked.occupied, locked.grades)
    await tx.section.delete({ where: { id: sectionId } })
    return true
  })
}

// Adds a weekly block to a section after the caller validates it against the locked state.
export function addScheduleBlockWithLock(params: {
  sectionId: string
  block: { weekday: Weekday; startMinutes: number; endMinutes: number }
  assertAllowed: (state: { occupied: number; ownBlocks: LockedBlock[]; professorBlocks: LockedProfessorBlock[] }) => void
}) {
  return prisma.$transaction(async (tx) => {
    const locked = await lockSection(tx, params.sectionId)
    if (!locked) return null
    params.assertAllowed(locked)
    return tx.scheduleBlock.create({
      data: {
        sectionId: params.sectionId,
        weekday: params.block.weekday,
        startTime: timeOf(params.block.startMinutes),
        endTime: timeOf(params.block.endMinutes),
      },
      select: { id: true },
    })
  })
}

// Removes one block of a section; returns false when the section or the block does not exist.
export function removeScheduleBlockWithLock(params: { sectionId: string; blockId: string; assertAllowed: (occupied: number) => void }) {
  return prisma.$transaction(async (tx) => {
    const locked = await lockSection(tx, params.sectionId)
    if (!locked || !locked.ownBlocks.some((block) => block.id === params.blockId)) return false
    params.assertAllowed(locked.occupied)
    await tx.scheduleBlock.delete({ where: { id: params.blockId } })
    return true
  })
}
