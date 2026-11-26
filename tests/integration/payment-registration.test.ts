import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createPreEnrolledStudent, prisma, removeStudents } from './payment-db'
import { findStudentAccounts, recordPayment, type PaymentRecord } from '@/data-access/repositories/payment.repository'
import { findFinancialHold, summarizeBalance, validatePaymentAmount } from '@/domain/billing/account-balance'
import { DomainError } from '@/domain/shared/domain-error'

const students: string[] = []

after(async () => {
  await removeStudents(students)
  await prisma.$disconnect()
})

// Enrolled student owing the given amount for the open term.
async function enrolledStudent(amount = 270) {
  const data = await createPreEnrolledStudent()
  students.push(data.student.id)
  await prisma.enrollment.update({ where: { id: data.enrollment.id }, data: { status: 'CONFIRMED', amount, enrolledAt: new Date() } })
  return data
}

const record = (enrollmentId: string, amount: number, overrides: Partial<PaymentRecord> = {}): PaymentRecord => ({
  enrollmentId,
  reference: `PAY-TEST-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
  method: 'ZELLE',
  currency: 'USD',
  amount,
  paidAmount: amount,
  exchangeRate: null,
  payerReference: `Z${Date.now()}${Math.random().toString(36).slice(2, 8)}`.toUpperCase(),
  details: { holderName: 'Prueba' },
  ...overrides,
})

// Rule the payment action applies under the enrollment lock.
const assertPayable = (amount: number) => (state: { status: string; amount: number; approvedPayments: number[] }) => {
  if (state.status !== 'CONFIRMED') throw new DomainError('Solo puedes pagar un período en el que estás inscrito.')
  const { balance } = summarizeBalance(
    state.amount,
    state.approvedPayments.map((value) => ({ amount: value, status: 'APPROVED' as const })),
  )
  validatePaymentAmount(amount, balance)
}

describe('payments of an enrolled term (database)', () => {
  it('records partial payments in different currencies until the term is paid', async () => {
    const { enrollment, student } = await enrolledStudent(270)
    const bolivares = await recordPayment(
      record(enrollment.id, 100, { method: 'PAGO_MOVIL', currency: 'VES', paidAmount: 92435.34, exchangeRate: 924.3534, payerReference: `${Date.now()}`.slice(-9) }),
      assertPayable(100),
    )
    assert.equal(bolivares.ok, true)
    await recordPayment(record(enrollment.id, 170), assertPayable(170))

    const [account] = (await findStudentAccounts(student.id)).filter((item) => item.id === enrollment.id)
    const balance = summarizeBalance(
      Number(account.amount),
      account.payments.map((payment) => ({ amount: Number(payment.amount), status: payment.status })),
    )
    assert.deepEqual([balance.paid, balance.balance, balance.settled], [270, 0, true])
    const stored = account.payments.find((payment) => payment.method === 'PAGO_MOVIL')!
    assert.deepEqual([Number(stored.paidAmount), Number(stored.exchangeRate), stored.currency], [92435.34, 924.3534, 'VES'])
  })

  it('refuses a payment above the balance and a payment of a term the student is not enrolled in', async () => {
    const { enrollment } = await enrolledStudent(100)
    await assert.rejects(recordPayment(record(enrollment.id, 100.01), assertPayable(100.01)), /supera tu saldo/)
    const preEnrolled = await createPreEnrolledStudent()
    students.push(preEnrolled.student.id)
    await assert.rejects(recordPayment(record(preEnrolled.enrollment.id, 10), assertPayable(10)), /estás inscrito/)
  })

  it('refuses a payer reference already used with the same method', async () => {
    const { enrollment } = await enrolledStudent(200)
    const reference = `DUP${Date.now()}`
    assert.equal((await recordPayment(record(enrollment.id, 50, { payerReference: reference }), assertPayable(50))).ok, true)
    assert.deepEqual(await recordPayment(record(enrollment.id, 50, { payerReference: reference }), assertPayable(50)), {
      ok: false,
      reason: 'duplicate-reference',
    })
  })

  it('never lets concurrent payments exceed the balance', async () => {
    const { enrollment } = await enrolledStudent(100)
    const results = await Promise.allSettled(Array.from({ length: 4 }, () => recordPayment(record(enrollment.id, 40), assertPayable(40))))
    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 2)
    const payments = await prisma.simulatedPayment.findMany({ where: { enrollmentId: enrollment.id } })
    assert.equal(payments.reduce((sum, payment) => sum + Number(payment.amount), 0), 80)
  })

  it('reports an earlier term with balance as a financial hold', async () => {
    const { enrollment, student, term } = await enrolledStudent(150)
    await recordPayment(record(enrollment.id, 50), assertPayable(50))
    const accounts = await findStudentAccounts(student.id)
    const later = new Date(term.endsAt.getTime() + 86_400_000)
    const hold = findFinancialHold(
      accounts.map((account) => ({
        termName: account.term.name,
        termStartsAt: account.term.startsAt,
        enrolled: account.status === 'CONFIRMED',
        amount: Number(account.amount),
        payments: account.payments.map((payment) => ({ amount: Number(payment.amount), status: payment.status })),
      })),
      later,
    )
    assert.deepEqual(
      hold.map((debt) => [debt.termName, debt.balance]),
      [[term.name, 100]],
    )
  })
})
