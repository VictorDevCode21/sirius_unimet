import { prisma } from '@/data-access/prisma'
import { isUniqueViolation } from '@/data-access/unique-violation'

const careerSelect = {
  id: true,
  name: true,
  active: true,
  department: { select: { name: true } },
  _count: { select: { students: true, subjects: true } },
}

export function listCareers() {
  return prisma.career.findMany({ select: careerSelect, orderBy: { name: 'asc' } })
}

export function findCareerUsage(careerId: string) {
  return prisma.career.findUnique({ where: { id: careerId }, select: careerSelect })
}

export function listDepartmentOptions() {
  return prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })
}

export function departmentExists(departmentId: string) {
  return prisma.department.count({ where: { id: departmentId } }).then(Boolean)
}

// Creates a career; returns null when the name is taken, ignoring case.
export async function createCareer(data: { name: string; departmentId: string }) {
  const existing = await prisma.career.findFirst({ where: { name: { equals: data.name, mode: 'insensitive' } } })
  if (existing) return null
  try {
    return await prisma.career.create({ data })
  } catch (error) {
    if (isUniqueViolation(error)) return null
    throw error
  }
}

type CareerUsage = { studentCount: number; subjectCount: number }

// Deletes a career only if `canDelete` allows it. The row lock makes the check and the delete atomic: without it a
// student assigned in between would silently lose their career, because the optional relation is set to null.
export async function deleteCareerIfUnused(careerId: string, canDelete: (usage: CareerUsage) => boolean) {
  return prisma.$transaction(async (tx) => {
    const [locked] = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Career" WHERE "id" = ${careerId}::uuid FOR UPDATE`
    if (!locked) return { outcome: 'missing' as const }

    const career = await tx.career.findUniqueOrThrow({ where: { id: careerId }, select: careerSelect })
    if (!canDelete({ studentCount: career._count.students, subjectCount: career._count.subjects })) {
      return { outcome: 'in-use' as const, active: career.active }
    }
    await tx.career.delete({ where: { id: careerId } })
    return { outcome: 'deleted' as const, name: career.name }
  })
}

export function setCareerActive(careerId: string, active: boolean) {
  return prisma.career.update({ where: { id: careerId }, data: { active } })
}
