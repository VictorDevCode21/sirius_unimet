import { prisma } from '@/data-access/prisma'
import { isUniqueViolation } from '@/data-access/unique-violation'

export function listTerms() {
  return prisma.term.findMany({ orderBy: { startsAt: 'desc' } })
}

// Creates a closed term; returns null when the name is already taken.
export async function createTerm(data: { name: string; startsAt: Date; endsAt: Date }) {
  try {
    return await prisma.term.create({ data: { ...data, open: false } })
  } catch (error) {
    if (isUniqueViolation(error)) return null
    throw error
  }
}

export function findTermById(termId: string) {
  return prisma.term.findUnique({ where: { id: termId } })
}

type TermRecord = NonNullable<Awaited<ReturnType<typeof findTermById>>>

// Opens a term while holding a table lock, so two concurrent requests can never leave two terms open.
// Returns null when the term does not exist.
export async function openTerm(termId: string, assertCanOpen: (term: TermRecord, openTerm: TermRecord | null) => void) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`LOCK TABLE "Term" IN SHARE ROW EXCLUSIVE MODE`
    const term = await tx.term.findUnique({ where: { id: termId } })
    if (!term) return null
    assertCanOpen(term, await tx.term.findFirst({ where: { open: true } }))
    return tx.term.update({ where: { id: termId }, data: { open: true } })
  })
}

// Closes a term; returns null when the term does not exist.
export async function closeTerm(termId: string) {
  const { count } = await prisma.term.updateMany({ where: { id: termId }, data: { open: false } })
  return count ? findTermById(termId) : null
}
