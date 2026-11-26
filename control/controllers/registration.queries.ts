import 'server-only'
import { getStudentContext } from '@/control/controllers/student-context'
import { getFinancialHold, getStudentTurn } from '@/control/controllers/student-standing'
import { findEnrollment } from '@/data-access/repositories/enrollment.repository'
import { findOpenTerm } from '@/data-access/repositories/term.repository'
import { summarizeAmount } from '@/domain/billing/amount-calculator'
import { countTakenSeats } from '@/domain/enrollment/seat-rules'
import { seatsLeft } from '@/domain/enrollment/offer-rules'

const toMinutes = (time: Date) => time.getUTCHours() * 60 + time.getUTCMinutes()

// Enrollment page of the open term: the student's turn, any financial hold and the pre-enrolled sections with the
// seats left in each one right now.
export async function getRegistration() {
  const { profile } = await getStudentContext()
  const term = await findOpenTerm()
  if (!term) return null

  const [turn, hold, enrollment] = await Promise.all([
    getStudentTurn(profile.id, term),
    getFinancialHold(profile.id, term.startsAt),
    findEnrollment(profile.id, term.id),
  ])
  const sections = (enrollment?.details ?? []).map(({ section }) => {
    const taken = countTakenSeats(section.enrollmentDetails.map((detail) => detail.enrollment.status))
    // A confirmed enrollment already holds its own seats, so they are not counted against it.
    const own = enrollment?.status === 'CONFIRMED' ? 1 : 0
    const left = seatsLeft(section.capacity, taken - own)
    return {
      id: section.id,
      number: section.number,
      professor: section.professor.name,
      subject: { code: section.subject.code, name: section.subject.name, credits: section.subject.credits },
      blocks: section.scheduleBlocks.map((block) => ({ weekday: block.weekday, startMinutes: toMinutes(block.startTime), endMinutes: toMinutes(block.endTime) })),
      seatsLeft: left,
      full: left === 0,
    }
  })
  const ratePerCredit = Number(term.ratePerCredit)
  const { totalCredits, amount } = summarizeAmount(
    sections.map((section) => section.subject),
    ratePerCredit,
  )

  return {
    term: { id: term.id, name: term.name, ratePerCredit, enrollmentStartsAt: term.enrollmentStartsAt },
    turn,
    hold,
    status: enrollment?.status ?? null,
    enrolledAt: enrollment?.enrolledAt ?? null,
    amount: enrollment?.status === 'CONFIRMED' ? Number(enrollment.amount) : amount,
    totalCredits,
    sections,
  }
}

export type Registration = NonNullable<Awaited<ReturnType<typeof getRegistration>>>
