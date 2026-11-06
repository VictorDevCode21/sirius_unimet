import { prisma } from '@/data-access/prisma'
import { isUniqueViolation } from '@/data-access/unique-violation'
import type { PricedEnrollment } from '@/domain/billing/repricing'

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

// Saves the fee of a term and reprices its enrollments in one transaction. The row lock on the term serializes
// concurrent fee changes. Returns null when the term does not exist.
export async function updateRatePerCredit(termId: string, ratePerCredit: number, reprice: (enrollment: PricedEnrollment) => number) {
  return prisma.$transaction(
    async (tx) => {
      const [locked] = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Term" WHERE "id" = ${termId}::uuid FOR UPDATE`
      if (!locked) return null

      const term = await tx.term.update({ where: { id: termId }, data: { ratePerCredit } })
      const enrollments = await tx.enrollment.findMany({
        where: { termId },
        select: {
          id: true,
          status: true,
          amount: true,
          details: { select: { section: { select: { subject: { select: { credits: true } } } } } },
        },
      })
      for (const enrollment of enrollments) {
        const amount = Number(enrollment.amount)
        const credits = enrollment.details.reduce((sum, detail) => sum + detail.section.subject.credits, 0)
        const repriced = reprice({ status: enrollment.status, amount, credits })
        if (repriced !== amount) await tx.enrollment.update({ where: { id: enrollment.id }, data: { amount: repriced } })
      }
      return term
    },
    { timeout: 30_000 },
  )
}
