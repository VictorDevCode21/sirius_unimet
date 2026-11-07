import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createPreEnrolledStudent, prisma, removeStudents } from './payment-db'
import { recordSimulatedPayment } from '@/data-access/repositories/payment.repository'
import { calculateAmount } from '@/domain/billing/amount-calculator'
import { paymentReference, statusAfterPayment, validatePayable, type PaymentOutcome } from '@/domain/billing/payment-simulator'

const students: string[] = []

after(async () => {
  await removeStudents(students)
  await prisma.$disconnect()
})

async function fixture() {
  const data = await createPreEnrolledStudent()
  students.push(data.student.id)
  const pay = (outcome: PaymentOutcome, attemptId = crypto.randomUUID()) =>
    recordSimulatedPayment({
      enrollmentId: data.enrollment.id,
      reference: paymentReference(data.term.name, attemptId),
      outcome,
      computeAmount: (credits) => calculateAmount(credits, Number(data.term.ratePerCredit)),
      assertPayable: validatePayable,
      statusAfter: statusAfterPayment,
    })
  const status = async () => (await prisma.enrollment.findUniqueOrThrow({ where: { id: data.enrollment.id } })).status
  const count = (paymentStatus?: 'APPROVED' | 'REJECTED') => prisma.simulatedPayment.count({ where: { enrollmentId: data.enrollment.id, status: paymentStatus } })
  return { ...data, pay, status, count }
}

describe('HU-18B rejected payment, retry and no double payment (database)', () => {
  it('goes rejected → pending → retry approved → confirmed, keeping every attempt', async () => {
    const { pay, status, count } = await fixture()
    assert.equal((await pay('REJECTED'))?.payment.status, 'REJECTED')
    assert.equal(await status(), 'PENDING')
    assert.equal((await pay('REJECTED'))?.payment.status, 'REJECTED')
    assert.equal(await status(), 'PENDING')
    assert.equal((await pay('APPROVED'))?.payment.status, 'APPROVED')
    assert.equal(await status(), 'CONFIRMED')
    assert.deepEqual([await count('REJECTED'), await count('APPROVED')], [2, 1])
  })

  it('creates a single approval when retries arrive concurrently', async () => {
    const { pay, status, count } = await fixture()
    await pay('REJECTED')
    const results = await Promise.allSettled([...Array.from({ length: 5 }, () => pay('APPROVED')), pay('REJECTED'), pay('REJECTED')])
    const rejectedAfterApproval = results.filter((result) => result.status === 'rejected')
    assert.ok(rejectedAfterApproval.every((result) => result.status === 'rejected' && /ya está pagada/.test(String(result.reason))))
    assert.equal(await count('APPROVED'), 1)
    assert.equal(await status(), 'CONFIRMED')
  })

  it('does not accept new attempts after approval and replays a repeated attempt', async () => {
    const { pay, count } = await fixture()
    const attempt = crypto.randomUUID()
    await pay('REJECTED', attempt)
    const replay = await pay('REJECTED', attempt)
    assert.equal(replay?.replayed, true)
    assert.equal(await count('REJECTED'), 1)
    await pay('APPROVED')
    await assert.rejects(pay('REJECTED'), /ya está pagada/)
    await assert.rejects(pay('APPROVED'), /ya está pagada/)
    assert.equal(await count(), 2)
  })
})
