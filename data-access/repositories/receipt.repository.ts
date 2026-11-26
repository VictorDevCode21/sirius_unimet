import { prisma } from '@/data-access/prisma'
import { sectionInclude } from '@/data-access/repositories/section.repository'

// Confirmed (paid) enrollments of a student, newest term first, with their sections and approved payment.
export function findConfirmedEnrollments(studentId: string) {
  return prisma.enrollment.findMany({
    where: { studentId, status: 'CONFIRMED' },
    include: {
      term: true,
      details: { include: { section: { include: sectionInclude } }, orderBy: { createdAt: 'asc' } },
      payments: { where: { status: 'APPROVED' }, orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { term: { startsAt: 'desc' } },
  })
}
