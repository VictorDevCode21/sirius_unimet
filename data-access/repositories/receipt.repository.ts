import { prisma } from '@/data-access/prisma'
import { sectionInclude } from '@/data-access/repositories/section.repository'

// Enrollments of a student (status CONFIRMED: enrolled with seats), newest term first, with their sections and
// approved payments.
export function findConfirmedEnrollments(studentId: string) {
  return prisma.enrollment.findMany({
    where: { studentId, status: 'CONFIRMED' },
    include: {
      term: true,
      details: { include: { section: { include: sectionInclude } }, orderBy: { createdAt: 'asc' } },
      payments: { where: { status: 'APPROVED' }, orderBy: { createdAt: 'desc' } },
    },
    orderBy: { term: { startsAt: 'desc' } },
  })
}
