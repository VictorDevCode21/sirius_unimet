import { prisma } from '@/data-access/prisma'
import { sectionInclude } from '@/data-access/repositories/section.repository'

const enrollmentInclude = {
  term: true,
  details: { include: { section: { include: sectionInclude } }, orderBy: { createdAt: 'asc' as const } },
}

export function findEnrollment(studentId: string, termId: string) {
  return prisma.enrollment.findUnique({ where: { studentId_termId: { studentId, termId } }, include: enrollmentInclude })
}

// Credits of each section in an enrollment and the rate per credit of its term.
export async function findEnrollmentCredits(enrollmentId: string, client: Pick<typeof prisma, 'enrollment'> = prisma) {
  const enrollment = await client.enrollment.findUniqueOrThrow({
    where: { id: enrollmentId },
    select: {
      term: { select: { ratePerCredit: true } },
      details: { select: { section: { select: { subject: { select: { credits: true } } } } } },
    },
  })
  return {
    ratePerCredit: Number(enrollment.term.ratePerCredit),
    sections: enrollment.details.map((detail) => ({ credits: detail.section.subject.credits })),
  }
}

// Subjects of the student's confirmed enrollment in a term that still have no published grade.
export async function findInProgressSubjectIds(studentId: string, termId: string) {
  const details = await prisma.enrollmentDetail.findMany({
    where: { enrollment: { studentId, termId, status: 'CONFIRMED' } },
    select: { section: { select: { subjectId: true, grades: { where: { studentId, published: true }, select: { value: true } } } } },
  })
  return details.filter((detail) => !detail.section.grades.length).map((detail) => detail.section.subjectId)
}

// Adds a section to the student's pre-enrollment after checking, under a row lock on the section, that the enrollments
// holding a seat have not filled it. Pre-enrolling does not take a seat; seats are taken when the enrollment is confirmed.
export async function addSectionWithSeatLock(params: {
  studentId: string
  termId: string
  sectionId: string
  assertSeatAvailable: (enrollmentStatuses: string[], capacity: number) => void
  computeAmount: (totalCredits: number) => number
}) {
  return prisma.$transaction(async (tx) => {
    const [locked] = await tx.$queryRaw<{ capacity: number }[]>`
      SELECT "capacity" FROM "Section" WHERE "id" = ${params.sectionId}::uuid FOR UPDATE`
    const details = await tx.enrollmentDetail.findMany({
      where: { sectionId: params.sectionId },
      select: { enrollment: { select: { status: true } } },
    })
    params.assertSeatAvailable(
      details.map((detail) => detail.enrollment.status),
      locked.capacity,
    )

    const enrollment = await tx.enrollment.upsert({
      where: { studentId_termId: { studentId: params.studentId, termId: params.termId } },
      update: {},
      create: { studentId: params.studentId, termId: params.termId },
    })
    await tx.enrollmentDetail.create({ data: { enrollmentId: enrollment.id, sectionId: params.sectionId } })
    await refreshAmount(tx, enrollment.id, params.computeAmount)
  })
}

// Swaps one section of the enrollment for another in a single transaction, checking under a row lock that the new
// section is not full, so the student never ends up with both sections or with none.
export async function replaceSectionWithSeatLock(params: {
  enrollmentId: string
  replacedSectionId: string
  sectionId: string
  assertSeatAvailable: (enrollmentStatuses: string[], capacity: number) => void
  computeAmount: (totalCredits: number) => number
}) {
  return prisma.$transaction(async (tx) => {
    const [locked] = await tx.$queryRaw<{ capacity: number }[]>`
      SELECT "capacity" FROM "Section" WHERE "id" = ${params.sectionId}::uuid FOR UPDATE`
    const details = await tx.enrollmentDetail.findMany({
      where: { sectionId: params.sectionId },
      select: { enrollment: { select: { status: true } } },
    })
    params.assertSeatAvailable(
      details.map((detail) => detail.enrollment.status),
      locked.capacity,
    )

    await tx.enrollmentDetail.delete({
      where: { enrollmentId_sectionId: { enrollmentId: params.enrollmentId, sectionId: params.replacedSectionId } },
    })
    await tx.enrollmentDetail.create({ data: { enrollmentId: params.enrollmentId, sectionId: params.sectionId } })
    await refreshAmount(tx, params.enrollmentId, params.computeAmount)
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

// Turns a pre-enrollment into an enrollment with seats in one transaction: locks the enrollment, keeps only the chosen
// sections, takes their seats (`takeSeats` locks the sections until the commit and throws when one is full), stores
// the amount and sets the status to CONFIRMED. Returns null when the enrollment no longer exists. `assertEnrollable`
// receives the locked status and throws when the enrollment cannot be confirmed.
export async function confirmPreEnrollment(params: {
  enrollmentId: string
  keepSectionIds: string[]
  assertEnrollable: (status: string) => void
  takeSeats: (tx: TransactionClient) => Promise<void>
  computeAmount: (tx: TransactionClient) => Promise<number>
}) {
  return prisma.$transaction(async (tx) => {
    const [locked] = await tx.$queryRaw<{ status: string }[]>`
      SELECT "status" FROM "Enrollment" WHERE "id" = ${params.enrollmentId}::uuid FOR UPDATE`
    if (!locked) return null
    params.assertEnrollable(locked.status)
    await tx.enrollmentDetail.deleteMany({ where: { enrollmentId: params.enrollmentId, sectionId: { notIn: params.keepSectionIds } } })
    await params.takeSeats(tx)
    const amount = await params.computeAmount(tx)
    return tx.enrollment.update({
      where: { id: params.enrollmentId },
      data: { status: 'CONFIRMED', amount, enrolledAt: new Date() },
      include: { details: { select: { sectionId: true } } },
    })
  })
}
