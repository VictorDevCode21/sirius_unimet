import 'server-only'
import { getStudentContext } from '@/control/controllers/student-context'
import type { Prisma } from '@/data-access/generated/prisma/client'
import { findEnrollment, findEnrollmentCredits } from '@/data-access/repositories/enrollment.repository'
import { findOpenTerm } from '@/data-access/repositories/term.repository'
import { summarizeAmount } from '@/domain/billing/amount-calculator'

const toMinutes = (time: Date) => time.getUTCHours() * 60 + time.getUTCMinutes()

// Enrollment summary of the signed-in student for the open term: each section with its schedule and credits, the total
// credits and the amount computed on the server (total credits × the term's rate per credit).
export async function getEnrollmentSummary() {
  const { profile } = await getStudentContext()
  const term = await findOpenTerm()
  if (!term) return null

  const enrollment = await findEnrollment(profile.id, term.id)
  const sections = (enrollment?.details ?? []).map(({ section }) => ({
    id: section.id,
    number: section.number,
    professor: section.professor.name,
    blocks: section.scheduleBlocks.map((block) => ({
      weekday: block.weekday,
      startMinutes: toMinutes(block.startTime),
      endMinutes: toMinutes(block.endTime),
    })),
    subject: { code: section.subject.code, name: section.subject.name, credits: section.subject.credits },
  }))
  const ratePerCredit = Number(term.ratePerCredit)
  const { totalCredits, amount } = summarizeAmount(
    sections.map((section) => section.subject),
    ratePerCredit,
  )

  return {
    term: { name: term.name, ratePerCredit, maxCredits: term.maxCredits },
    status: enrollment?.status ?? null,
    sections,
    totalCredits,
    amount,
  }
}

export type EnrollmentSummary = NonNullable<Awaited<ReturnType<typeof getEnrollmentSummary>>>

/**
 * Amount to charge for an enrollment, computed on the server from its sections' credits and its term's rate per
 * credit. The payment flow uses it instead of any amount sent by the browser. Pass `tx` to read inside the payment
 * transaction.
 */
export async function getEnrollmentAmount(enrollmentId: string, tx?: Prisma.TransactionClient): Promise<number> {
  const { sections, ratePerCredit } = await findEnrollmentCredits(enrollmentId, tx)
  return summarizeAmount(sections, ratePerCredit).amount
}
