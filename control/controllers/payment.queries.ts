import 'server-only'
import { getStudentContext } from '@/control/controllers/student-context'
import { findEnrollment } from '@/data-access/repositories/enrollment.repository'
import { listPayments } from '@/data-access/repositories/payment.repository'
import { findOpenTerm } from '@/data-access/repositories/term.repository'
import { calculateAmount } from '@/domain/billing/amount-calculator'

const toMinutes = (time: Date) => time.getUTCHours() * 60 + time.getUTCMinutes()

// Enrollment of the open term with its sections and payment attempts. The amount is what was paid once the enrollment
// is confirmed, and otherwise what the payment will charge (credits × current rate per credit, as the payment action).
export async function getPaymentSummary() {
  const { profile } = await getStudentContext()
  const term = await findOpenTerm()
  if (!term) return null
  const enrollment = await findEnrollment(profile.id, term.id)
  const payments = enrollment ? await listPayments(enrollment.id) : []
  const sections = (enrollment?.details ?? []).map(({ section }) => ({
    id: section.id,
    number: section.number,
    subject: { code: section.subject.code, name: section.subject.name, credits: section.subject.credits },
    blocks: section.scheduleBlocks.map((block) => ({ weekday: block.weekday, startMinutes: toMinutes(block.startTime), endMinutes: toMinutes(block.endTime) })),
  }))
  const ratePerCredit = Number(term.ratePerCredit)
  const totalCredits = sections.reduce((sum, section) => sum + section.subject.credits, 0)
  return {
    term: { name: term.name, ratePerCredit },
    status: enrollment?.status ?? null,
    amount: enrollment?.status === 'CONFIRMED' ? Number(enrollment.amount) : calculateAmount(totalCredits, ratePerCredit),
    totalCredits,
    sections,
    payments: payments.map((payment) => ({ reference: payment.reference, amount: Number(payment.amount), status: payment.status, createdAt: payment.createdAt })),
  }
}

export type PaymentSummary = NonNullable<Awaited<ReturnType<typeof getPaymentSummary>>>
