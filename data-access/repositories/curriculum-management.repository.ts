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

// Why a subject write was refused: its code or its grid cell is already taken in the career, or the career does
// not exist.
export type SubjectWriteConflict = 'code' | 'cell' | 'career'

export type SubjectWriteResult =
  | { ok: true; subject: Awaited<ReturnType<typeof prisma.subject.create>> }
  | { ok: false; conflict: SubjectWriteConflict }

const isForeignKeyViolation = (error: unknown) => typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2003'

// Tells which unique value a refused write collided with, looking at the other subjects of the career.
async function uniqueConflict(careerId: string, data: SubjectData, subjectId?: string): Promise<SubjectWriteConflict> {
  const sameCode = await prisma.subject.findFirst({ where: { careerId, code: data.code, id: subjectId ? { not: subjectId } : undefined } })
  return sameCode ? 'code' : 'cell'
}

// Creates a subject, or tells why it could not: a taken code or cell, or a career that does not exist.
export async function createSubject(careerId: string, data: SubjectData): Promise<SubjectWriteResult> {
  try {
    return { ok: true, subject: await prisma.subject.create({ data: { careerId, ...data } }) }
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, conflict: await uniqueConflict(careerId, data) }
    if (isForeignKeyViolation(error)) return { ok: false, conflict: 'career' }
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

// Updates a subject, or tells which of its code or grid cell is already taken in the career.
export async function updateSubject(subjectId: string, careerId: string, data: SubjectData): Promise<SubjectWriteResult> {
  try {
    return { ok: true, subject: await prisma.subject.update({ where: { id: subjectId }, data }) }
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, conflict: await uniqueConflict(careerId, data, subjectId) }
    throw error
  }
}
