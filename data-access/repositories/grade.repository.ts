import { prisma } from '@/data-access/prisma'

export function findPublishedGradesByStudent(studentId: string) {
  return prisma.grade.findMany({
    where: { studentId, published: true },
    include: { section: { include: { subject: true, term: true } } },
    orderBy: { section: { term: { startsAt: 'desc' } } },
  })
}
