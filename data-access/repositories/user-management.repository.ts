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

export function findUserForEdit(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      careerId: true,
      headedDepartment: { select: { id: true } },
      _count: { select: { taughtSections: true, enrollments: true } },
    },
  })
}

// Updates a user; returns null when the email belongs to another user.
export async function updateUser(userId: string, data: { name: string; email: string; role: UserRole; careerId: string | null }) {
  try {
    return await prisma.user.update({ where: { id: userId }, data })
  } catch (error) {
    if (isUniqueViolation(error)) return null
    throw error
  }
}

// Soft delete: the row and its history stay, and the login rejects inactive users.
export function setUserActive(userId: string, active: boolean) {
  return prisma.user.update({ where: { id: userId }, data: { active } })
}
