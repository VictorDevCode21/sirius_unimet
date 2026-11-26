import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createPreEnrolledStudent, createStudentInSection, prisma, removeStudents } from './payment-db'
import { confirmEnrollmentSeats } from '@/control/controllers/seat-confirmation'
import { findEnrollmentCredits } from '@/data-access/repositories/enrollment.repository'
import { recordSimulatedPayment } from '@/data-access/repositories/payment.repository'
import { summarizeAmount } from '@/domain/billing/amount-calculator'
import { paymentReference, statusAfterPayment, validatePayable } from '@/domain/billing/payment-simulator'

const students: string[] = []
const sections: string[] = []

after(async () => {
  await removeStudents(students)
  await prisma.section.deleteMany({ where: { id: { in: sections } } })
  await prisma.$disconnect()
})

async function fixture() {
  const data = await createPreEnrolledStudent()
  students.push(data.student.id)
  const pay = (attemptId = crypto.randomUUID()) => payEnrollment(data.enrollment.id, data.term.name, attemptId)
  return { ...data, pay }
}

// Approves a payment the way the payment action does: amount and seats are handled inside the payment transaction.
function payEnrollment(enrollmentId: string, termName: string, attemptId = crypto.randomUUID()) {
  return recordSimulatedPayment({
    enrollmentId,
    reference: paymentReference(termName, attemptId),
    outcome: 'APPROVED',
    computeAmount: async (tx) => {
      const { sections, ratePerCredit } = await findEnrollmentCredits(enrollmentId, tx)
      return summarizeAmount(sections, ratePerCredit).amount
    },
    takeSeats: (tx) => confirmEnrollmentSeats(enrollmentId, tx),
    assertPayable: validatePayable,
    statusAfter: statusAfterPayment,
  })
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

  it('confirms only one of two students paying for the last seat of a section', async () => {
    const term = await prisma.term.findFirstOrThrow({ where: { open: true } })
    const subject = await prisma.subject.findFirstOrThrow({ where: { code: 'FPTSP27' } })
    const professor = await prisma.user.findFirstOrThrow({ where: { role: 'PROFESSOR', NOT: { email: { endsWith: '@test.local' } } } })
    const lastSeat = await prisma.section.create({
      data: {
        number: 93,
        capacity: 1,
        termId: term.id,
        subjectId: subject.id,
        professorId: professor.id,
        scheduleBlocks: { create: { weekday: 'SAT', startTime: new Date(Date.UTC(1970, 0, 1, 14)), endTime: new Date(Date.UTC(1970, 0, 1, 16)) } },
      },
    })
    sections.push(lastSeat.id)
    const buyers = await Promise.all(
      [0, 1].map(() => createStudentInSection(term.id, lastSeat.id, Number(term.ratePerCredit), subject.credits)),
    )
    students.push(...buyers.map((buyer) => buyer.student.id))

    const results = await Promise.allSettled(buyers.map((buyer) => payEnrollment(buyer.enrollment.id, term.name)))
    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1)
    const rejected = results.find((result) => result.status === 'rejected') as PromiseRejectedResult
    assert.match(rejected.reason.message, /se llenó/)

    const stored = await prisma.enrollment.findMany({ where: { id: { in: buyers.map((buyer) => buyer.enrollment.id) } }, include: { payments: true } })
    assert.deepEqual(stored.map((enrollment) => enrollment.status).sort(), ['CONFIRMED', 'PRE_ENROLLED'])
    assert.equal(stored.find((enrollment) => enrollment.status === 'PRE_ENROLLED')!.payments.length, 0)
  })
})
