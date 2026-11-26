import { prisma } from '@/data-access/prisma'
import { isUniqueViolation } from '@/data-access/unique-violation'
import type { UserRole } from '@/domain/users/user-rules'

export function listUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true, career: { select: { name: true } } },
    orderBy: { name: 'asc' },
  })
}

// Careers that can be assigned to a student.
export function listActiveCareers() {
  return prisma.career.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } })
}

export function findCareerById(careerId: string) {
  return prisma.career.findUnique({ where: { id: careerId }, select: { id: true, active: true } })
}

// Creates a user; returns null when the email is already registered.
export async function createUser(data: { name: string; email: string; passwordHash: string; role: UserRole; careerId: string | null }) {
  try {
    return await prisma.user.create({ data })
  } catch (error) {
    if (isUniqueViolation(error)) return null
    throw error
  }
}
