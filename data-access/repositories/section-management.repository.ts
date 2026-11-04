import { prisma } from '@/data-access/prisma'
import { Prisma } from '@/data-access/generated/prisma/client'

// True when the error is a unique constraint violation (P2002).
export function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

export function findDepartmentByHead(headId: string) {
  return prisma.department.findUnique({
    where: { headId },
    select: { id: true, name: true, careers: { select: { id: true, name: true }, orderBy: { name: 'asc' } } },
  })
}

export function listTerms() {
  return prisma.term.findMany({ orderBy: { startsAt: 'desc' }, select: { id: true, name: true, startsAt: true, endsAt: true, open: true } })
}

export function findTermById(termId: string) {
  return prisma.term.findUnique({ where: { id: termId }, select: { id: true, name: true, startsAt: true, endsAt: true, open: true } })
}

export function listDepartmentSubjects(departmentId: string) {
  return prisma.subject.findMany({
    where: { career: { departmentId } },
    select: { id: true, code: true, name: true, credits: true, term: true, career: { select: { name: true } } },
    orderBy: [{ career: { name: 'asc' } }, { term: 'asc' }, { branch: 'asc' }],
  })
}

export function findSubjectInDepartment(subjectId: string, departmentId: string) {
  return prisma.subject.findFirst({ where: { id: subjectId, career: { departmentId } }, select: { id: true, code: true, name: true } })
}

export function listActiveProfessors() {
  return prisma.user.findMany({ where: { role: 'PROFESSOR', active: true }, select: { id: true, name: true, email: true }, orderBy: { name: 'asc' } })
}

export function findUserRole(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, role: true, active: true } })
}

export const managedSectionInclude = {
  subject: { select: { id: true, code: true, name: true, credits: true, career: { select: { name: true } } } },
  term: { select: { id: true, name: true, endsAt: true } },
  professor: { select: { id: true, name: true } },
  scheduleBlocks: { orderBy: [{ weekday: 'asc' as const }, { startTime: 'asc' as const }] },
  _count: { select: { enrollmentDetails: true, grades: true } },
}

export function listDepartmentSections(departmentId: string, termId: string) {
  return prisma.section.findMany({
    where: { termId, subject: { career: { departmentId } } },
    include: managedSectionInclude,
    orderBy: [{ subject: { career: { name: 'asc' } } }, { subject: { term: 'asc' } }, { subject: { branch: 'asc' } }, { number: 'asc' }],
  })
}

export function findDepartmentSection(sectionId: string, departmentId: string) {
  return prisma.section.findFirst({ where: { id: sectionId, subject: { career: { departmentId } } }, include: managedSectionInclude })
}

// Creates a section; when no number is given, the next free number of the subject in the term is used.
export function createSection(params: {
  subjectId: string
  termId: string
  professorId: string
  capacity: number
  number?: number
  nextNumber: (existing: number[]) => number
}) {
  return prisma.$transaction(async (tx) => {
    let number = params.number
    if (number === undefined) {
      const existing = await tx.section.findMany({ where: { subjectId: params.subjectId, termId: params.termId }, select: { number: true } })
      number = params.nextNumber(existing.map((section) => section.number))
    }
    return tx.section.create({
      data: { subjectId: params.subjectId, termId: params.termId, professorId: params.professorId, capacity: params.capacity, number },
      select: { id: true, number: true },
    })
  })
}
