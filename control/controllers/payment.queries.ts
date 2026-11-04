import 'server-only'
import { getStudentContext } from '@/control/controllers/student-context'
import { findEnrollment } from '@/data-access/repositories/enrollment.repository'
import { listPayments } from '@/data-access/repositories/payment.repository'
import { findOpenTerm } from '@/data-access/repositories/term.repository'

const toMinutes = (time: Date) => time.getUTCHours() * 60 + time.getUTCMinutes()

// Enrollment of the open term with its sections, amount and payment attempts, used by the payment simulator.
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
  return {
    term: { name: term.name, ratePerCredit: Number(term.ratePerCredit) },
    status: enrollment?.status ?? null,
    amount: Number(enrollment?.amount ?? 0),
    totalCredits: sections.reduce((sum, section) => sum + section.subject.credits, 0),
    sections,
    payments: payments.map((payment) => ({ reference: payment.reference, amount: Number(payment.amount), status: payment.status, createdAt: payment.createdAt })),
  }
}

export type PaymentSummary = NonNullable<Awaited<ReturnType<typeof getPaymentSummary>>>
