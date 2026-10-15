import { prisma } from '@/data-access/prisma'
import { sectionInclude } from '@/data-access/repositories/section.repository'

const enrollmentInclude = {
  term: true,
  details: { include: { section: { include: sectionInclude } }, orderBy: { createdAt: 'asc' as const } },
}

export function findEnrollment(studentId: string, termId: string) {
  return prisma.enrollment.findUnique({ where: { studentId_termId: { studentId, termId } }, include: enrollmentInclude })
}

// Subjects of the student's confirmed enrollment in a term that still have no published grade.
export async function findInProgressSubjectIds(studentId: string, termId: string) {
  const details = await prisma.enrollmentDetail.findMany({
    where: { enrollment: { studentId, termId, status: 'CONFIRMED' } },
    select: { section: { select: { subjectId: true, grades: { where: { studentId, published: true }, select: { value: true } } } } },
  })
  return details.filter((detail) => !detail.section.grades.length).map((detail) => detail.section.subjectId)
}

// Adds a section to the student's enrollment while holding a row lock on the section, so a seat is never
// assigned twice under concurrent enrollments.
export async function addSectionWithSeatLock(params: {
  studentId: string
  termId: string
  sectionId: string
  assertSeatAvailable: (occupied: number, capacity: number) => void
  computeAmount: (totalCredits: number) => number
}) {
  return prisma.$transaction(async (tx) => {
    const [locked] = await tx.$queryRaw<{ capacity: number }[]>`
      SELECT "capacity" FROM "Section" WHERE "id" = ${params.sectionId}::uuid FOR UPDATE`
    const occupied = await tx.enrollmentDetail.count({ where: { sectionId: params.sectionId } })
    params.assertSeatAvailable(occupied, locked.capacity)

    const enrollment = await tx.enrollment.upsert({
      where: { studentId_termId: { studentId: params.studentId, termId: params.termId } },
      update: {},
      create: { studentId: params.studentId, termId: params.termId },
    })
    await tx.enrollmentDetail.create({ data: { enrollmentId: enrollment.id, sectionId: params.sectionId } })
    await refreshAmount(tx, enrollment.id, params.computeAmount)
  })
}

export async function removeSection(enrollmentId: string, sectionId: string, computeAmount: (totalCredits: number) => number) {
  return prisma.$transaction(async (tx) => {
    await tx.enrollmentDetail.delete({ where: { enrollmentId_sectionId: { enrollmentId, sectionId } } })
    await refreshAmount(tx, enrollmentId, computeAmount)
  })
}

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

async function refreshAmount(tx: TransactionClient, enrollmentId: string, computeAmount: (totalCredits: number) => number) {
  const details = await tx.enrollmentDetail.findMany({
    where: { enrollmentId },
    select: { section: { select: { subject: { select: { credits: true } } } } },
  })
  const totalCredits = details.reduce((sum, detail) => sum + detail.section.subject.credits, 0)
  await tx.enrollment.update({ where: { id: enrollmentId }, data: { amount: computeAmount(totalCredits) } })
}
