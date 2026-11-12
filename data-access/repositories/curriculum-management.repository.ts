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

export function findSubject(subjectId: string) {
  return prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      prerequisites: { select: { requirement: { select: { code: true, term: true } } } },
      requiredBy: { select: { subject: { select: { code: true, term: true } } } },
    },
  })
}

// Updates a subject; returns null when its code or grid cell is already taken in the career.
export async function updateSubject(subjectId: string, data: SubjectData) {
  try {
    return await prisma.subject.update({ where: { id: subjectId }, data })
  } catch (error) {
    if (isUniqueViolation(error)) return null
    throw error
  }
}

export interface SubjectRequirements {
  requirementIds: string[]
  minCredits: number | null
  alternativeCredits: number | null
  alternativeCreditBlock: string | null
}

// Replaces the prerequisites, minimum credits and credit alternative of a subject in one transaction.
export function replaceSubjectRequirements(subjectId: string, requirements: SubjectRequirements) {
  const { requirementIds, ...credits } = requirements
  return prisma.$transaction(async (tx) => {
    await tx.prerequisite.deleteMany({ where: { subjectId } })
    await tx.prerequisite.createMany({ data: requirementIds.map((requirementId) => ({ subjectId, requirementId })) })
    return tx.subject.update({ where: { id: subjectId }, data: credits })
  })
}

// Codes of the subjects of a career with how many sections each one has.
export async function findCareerSubjectSections(careerId: string) {
  const subjects = await prisma.subject.findMany({ where: { careerId }, select: { code: true, _count: { select: { sections: true } } } })
  return subjects.map((subject) => ({ code: subject.code, sections: subject._count.sections }))
}
