import 'dotenv/config'
import { prisma } from '@/data-access/prisma'
import { calculateAmount } from '@/domain/billing/amount-calculator'

export { prisma }

// Throwaway student with a PRE_ENROLLED enrollment of the open term holding two seeded sections.
export async function createPreEnrolledStudent() {
  const term = await prisma.term.findFirstOrThrow({ where: { open: true } })
  const sections = await prisma.section.findMany({ where: { termId: term.id }, include: { subject: true }, orderBy: { id: 'asc' }, take: 2 })
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
