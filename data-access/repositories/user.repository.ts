import { prisma } from '@/data-access/prisma'

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } })
}

export function findStudentProfile(studentId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
      email: true,
      career: { select: { id: true, name: true, department: { select: { name: true } } } },
    },
  })
}
