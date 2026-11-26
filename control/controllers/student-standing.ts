import 'server-only'
import { listStudentGradeRecords } from '@/data-access/repositories/enrollment-turn.repository'
import { findStudentAccounts } from '@/data-access/repositories/payment.repository'
import { findFinancialHold } from '@/domain/billing/account-balance'
import { assignTurns, computeIaa, computeLastTermAverage, enrollmentWindow, turnStartsAt, turnState } from '@/domain/enrollment/enrollment-turn'

interface TermWindow {
  enrollmentStartsAt: Date | null
}

// Enrollment turn of a student in a term: their academic index, the hour their turn starts and whether they can
// enroll now. Turns are computed among every active student.
export async function getStudentTurn(studentId: string, term: TermWindow, now = new Date()) {
  const records = await listStudentGradeRecords()
  const own = records.find((record) => record.studentId === studentId)?.grades ?? []
  const iaa = computeIaa(own)
  const lastTermAverage = computeLastTermAverage(own)
  if (!term.enrollmentStartsAt) {
    return { iaa, lastTermAverage, firstTrimester: iaa === null, turnAt: null, opensAt: null, closesAt: null, state: turnState(now, null, null) }
  }
  const turns = assignTurns(
    records.map((record) => ({ studentId: record.studentId, iaa: computeIaa(record.grades), lastTermAverage: computeLastTermAverage(record.grades) })),
  )
  const turnAt = turnStartsAt(term.enrollmentStartsAt, turns.get(studentId) ?? 0)
  const { opensAt, closesAt } = enrollmentWindow(term.enrollmentStartsAt)
  return { iaa, lastTermAverage, firstTrimester: iaa === null, turnAt, opensAt, closesAt, state: turnState(now, turnAt, closesAt) }
}

export type StudentTurn = Awaited<ReturnType<typeof getStudentTurn>>

// Earlier enrolled terms the student still owes money for, before the given term.
export async function getFinancialHold(studentId: string, termStartsAt: Date) {
  const accounts = await findStudentAccounts(studentId)
  return findFinancialHold(
    accounts.map((account) => ({
      termName: account.term.name,
      termStartsAt: account.term.startsAt,
      enrolled: account.status === 'CONFIRMED',
      amount: Number(account.amount),
      payments: account.payments.map((payment) => ({ amount: Number(payment.amount), status: payment.status })),
    })),
    termStartsAt,
  )
}
