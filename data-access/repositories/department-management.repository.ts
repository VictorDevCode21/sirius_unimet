import { prisma } from '@/data-access/prisma'
import { isUniqueViolation } from '@/data-access/unique-violation'

export function listDepartments() {
  return prisma.department.findMany({
    select: { id: true, name: true, headId: true, head: { select: { name: true } }, _count: { select: { careers: true } } },
    orderBy: { name: 'asc' },
  })
}

// Active users with the department-head role, with the department they already head.
export function listHeadCandidates() {
  return prisma.user.findMany({
    where: { role: 'DEPARTMENT_HEAD', active: true },
    select: { id: true, name: true, headedDepartment: { select: { id: true } } },
    orderBy: { name: 'asc' },
  })
}

export async function findHeadCandidate(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, active: true, headedDepartment: { select: { id: true } } },
  })
  return user && { role: user.role, active: user.active, headedDepartmentId: user.headedDepartment?.id ?? null }
}

// Creates a department; returns null when the name is taken, ignoring case.
export async function createDepartment(name: string) {
  const existing = await prisma.department.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } })
  if (existing) return null
  try {
    return await prisma.department.create({ data: { name } })
  } catch (error) {
    if (isUniqueViolation(error)) return null
    throw error
  }
}

// Sets or clears the head; returns null when the user started heading another department concurrently.
export async function assignDepartmentHead(departmentId: string, headId: string | null) {
  try {
    return await prisma.department.update({ where: { id: departmentId }, data: { headId } })
  } catch (error) {
    if (isUniqueViolation(error)) return null
    throw error
  }
}
