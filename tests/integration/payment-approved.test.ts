import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createPreEnrolledStudent, prisma, removeStudents } from './payment-db'
import { recordSimulatedPayment } from '@/data-access/repositories/payment.repository'
import { calculateAmount } from '@/domain/billing/amount-calculator'
import { paymentReference, statusAfterPayment, validatePayable } from '@/domain/billing/payment-simulator'

const students: string[] = []

after(async () => {
  await removeStudents(students)
  await prisma.$disconnect()
})

async function fixture() {
  const data = await createPreEnrolledStudent()
  students.push(data.student.id)
  const pay = (attemptId = crypto.randomUUID()) =>
    recordSimulatedPayment({
      enrollmentId: data.enrollment.id,
      reference: paymentReference(data.term.name, attemptId),
      outcome: 'APPROVED',
      computeAmount: (credits) => calculateAmount(credits, Number(data.term.ratePerCredit)),
      assertPayable: validatePayable,
      statusAfter: statusAfterPayment,
    })
  return { ...data, pay }
}

describe('HU-18A approved simulated payment (database)', () => {
  it('approves the payment, persists it and confirms the enrollment', async () => {
    const { enrollment, expectedAmount, pay } = await fixture()
    const result = await pay()
    assert.equal(result?.replayed, false)
    assert.equal(result?.payment.status, 'APPROVED')
    assert.equal(Number(result?.payment.amount), expectedAmount)
    const stored = await prisma.enrollment.findUniqueOrThrow({ where: { id: enrollment.id }, include: { payments: true } })
    assert.equal(stored.status, 'CONFIRMED')
    assert.equal(stored.payments.length, 1)
  })

  it('replays a repeated request of the same attempt without a second payment', async () => {
    const { enrollment, pay } = await fixture()
    const attempt = crypto.randomUUID()
    const first = await pay(attempt)
    const second = await pay(attempt)
    assert.equal(second?.replayed, true)
    assert.equal(second?.payment.id, first?.payment.id)
    assert.equal(await prisma.simulatedPayment.count({ where: { enrollmentId: enrollment.id } }), 1)
  })

  it('refuses to pay again an enrollment that is already confirmed', async () => {
    const { enrollment, pay } = await fixture()
    await pay()
    await assert.rejects(pay(), /ya está pagada/)
    assert.equal(await prisma.simulatedPayment.count({ where: { enrollmentId: enrollment.id } }), 1)
  })

  it('creates exactly one approved payment under concurrent clicks', async () => {
    const { enrollment, pay } = await fixture()
    const results = await Promise.allSettled(Array.from({ length: 6 }, () => pay()))
    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1)
    assert.equal(await prisma.simulatedPayment.count({ where: { enrollmentId: enrollment.id, status: 'APPROVED' } }), 1)
  })
})
