import { prisma } from '@/data-access/prisma'
import { isUniqueViolation } from '@/data-access/unique-violation'

export interface SubjectData {
  code: string
  name: string
  credits: number
  term: number
  branch: number
}

export function listCareers() {
  return prisma.career.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } })
}

export function findCareer(careerId: string) {
  return prisma.career.findUnique({ where: { id: careerId }, select: { id: true, name: true } })
}

// Subjects of a career laid out on the curriculum grid, with the ids of their prerequisites.
export function findCareerSubjects(careerId: string) {
  return prisma.subject.findMany({
    where: { careerId },
    include: { prerequisites: { select: { requirementId: true } } },
    orderBy: [{ term: 'asc' }, { branch: 'asc' }],
  })
}

// Creates a subject; returns null when its code or grid cell is already taken in the career.
export async function createSubject(careerId: string, data: SubjectData) {
  try {
    return await prisma.subject.create({ data: { careerId, ...data } })
  } catch (error) {
    if (isUniqueViolation(error)) return null
    throw error
  }
}
