import 'dotenv/config'
import { prisma } from '@/data-access/prisma'
import { calculateAmount } from '@/domain/billing/amount-calculator'

export { prisma }

// Throwaway student with a PRE_ENROLLED enrollment of the open term holding two seeded sections.
export async function createPreEnrolledStudent() {
  const term = await prisma.term.findFirstOrThrow({ where: { open: true } })
  // Two sections of different subjects with confirmed seats to spare, so approving the payment can take them.
  const candidates = await prisma.section.findMany({
    where: { termId: term.id, scheduleBlocks: { some: {} } },
    include: { subject: true, _count: { select: { enrollmentDetails: { where: { enrollment: { status: 'CONFIRMED' } } } } } },
    orderBy: { id: 'asc' },
  })
  const sections = candidates
    .filter((section) => section.capacity - section._count.enrollmentDetails >= 10)
    .filter((section, index, list) => list.findIndex((other) => other.subjectId === section.subjectId) === index)
    .slice(0, 2)
  const student = await prisma.user.create({
    data: { name: 'Estudiante pago', email: `pay-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`, passwordHash: 'x', role: 'STUDENT' },
  })
  const credits = sections.reduce((sum, section) => sum + section.subject.credits, 0)
  const enrollment = await prisma.enrollment.create({
    data: {
      studentId: student.id,
      termId: term.id,
      amount: calculateAmount(credits, Number(term.ratePerCredit)),
      details: { create: sections.map((section) => ({ sectionId: section.id })) },
    },
  })
  return { term, student, enrollment, expectedAmount: calculateAmount(credits, Number(term.ratePerCredit)) }
}

export async function removeStudents(ids: string[]) {
  await prisma.enrollment.deleteMany({ where: { studentId: { in: ids } } })
  await prisma.user.deleteMany({ where: { id: { in: ids } } })
}

// Throwaway student with a PRE_ENROLLED enrollment of the open term holding only the given section.
export async function createStudentInSection(termId: string, sectionId: string, ratePerCredit: number, credits: number) {
  const student = await prisma.user.create({
    data: { name: 'Estudiante cupo', email: `pay-seat-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`, passwordHash: 'x', role: 'STUDENT' },
  })
  const enrollment = await prisma.enrollment.create({
    data: { studentId: student.id, termId, amount: calculateAmount(credits, ratePerCredit), details: { create: { sectionId } } },
  })
  return { student, enrollment }
}
