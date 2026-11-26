import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createPreEnrolledStudent, createStudentInSection, prisma, removeStudents } from './payment-db'
import { confirmEnrollmentSeats } from '@/control/controllers/seat-confirmation'
import { confirmPreEnrollment, findEnrollmentCredits } from '@/data-access/repositories/enrollment.repository'
import { summarizeAmount } from '@/domain/billing/amount-calculator'
import { assertCanEnroll } from '@/domain/enrollment/registration-rules'

const students: string[] = []
const sections: string[] = []

after(async () => {
  await removeStudents(students)
  await prisma.section.deleteMany({ where: { id: { in: sections } } })
  await prisma.$disconnect()
})

// Enrolls the way the enrollment action does: seats and amount are handled inside the enrollment transaction.
function enrollSections(enrollmentId: string, keepSectionIds: string[]) {
  return confirmPreEnrollment({
    enrollmentId,
    keepSectionIds,
    assertEnrollable: assertCanEnroll,
    takeSeats: (tx) => confirmEnrollmentSeats(enrollmentId, tx),
    computeAmount: async (tx) => {
      const { sections: credits, ratePerCredit } = await findEnrollmentCredits(enrollmentId, tx)
      return summarizeAmount(credits, ratePerCredit).amount
    },
  })
}

describe('enrollment of a pre-enrollment (database)', () => {
  it('confirms the chosen sections, drops the rest and prices only what was enrolled', async () => {
    const { student, enrollment, term } = await createPreEnrolledStudent()
    students.push(student.id)
    const details = await prisma.enrollmentDetail.findMany({ where: { enrollmentId: enrollment.id }, include: { section: { include: { subject: true } } } })
    const kept = details[0]

    const confirmed = await enrollSections(enrollment.id, [kept.sectionId])
    assert.equal(confirmed?.status, 'CONFIRMED')
    assert.ok(confirmed?.enrolledAt instanceof Date)
    assert.deepEqual(
      confirmed?.details.map((detail) => detail.sectionId),
      [kept.sectionId],
    )
    assert.equal(Number(confirmed?.amount), kept.section.subject.credits * Number(term.ratePerCredit))
    assert.equal(await prisma.simulatedPayment.count({ where: { enrollmentId: enrollment.id } }), 0)
  })

  it('refuses to enroll the same pre-enrollment twice', async () => {
    const { student, enrollment } = await createPreEnrolledStudent()
    students.push(student.id)
    const ids = (await prisma.enrollmentDetail.findMany({ where: { enrollmentId: enrollment.id } })).map((detail) => detail.sectionId)
    await enrollSections(enrollment.id, ids)
    await assert.rejects(enrollSections(enrollment.id, ids), /Ya estás inscrito/)
  })

  it('gives the last seat of a section to only one of two students enrolling at the same time', async () => {
    const term = await prisma.term.findFirstOrThrow({ where: { open: true } })
    const subject = await prisma.subject.findFirstOrThrow({ where: { code: 'FPTSP27' } })
    const professor = await prisma.user.findFirstOrThrow({ where: { role: 'PROFESSOR', NOT: { email: { endsWith: '@test.local' } } } })
    const lastSeat = await prisma.section.create({
      data: {
        number: 94,
        capacity: 1,
        termId: term.id,
        subjectId: subject.id,
        professorId: professor.id,
        scheduleBlocks: { create: { weekday: 'SAT', startTime: new Date(Date.UTC(1970, 0, 1, 14)), endTime: new Date(Date.UTC(1970, 0, 1, 16)) } },
      },
    })
    sections.push(lastSeat.id)
    const buyers = await Promise.all([0, 1].map(() => createStudentInSection(term.id, lastSeat.id, Number(term.ratePerCredit), subject.credits)))
    students.push(...buyers.map((buyer) => buyer.student.id))

    const results = await Promise.allSettled(buyers.map((buyer) => enrollSections(buyer.enrollment.id, [lastSeat.id])))
    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1)
    const rejected = results.find((result) => result.status === 'rejected') as PromiseRejectedResult
    assert.match(rejected.reason.message, /se llenó/)
    const stored = await prisma.enrollment.findMany({ where: { id: { in: buyers.map((buyer) => buyer.enrollment.id) } } })
    assert.deepEqual(stored.map((enrollment) => enrollment.status).sort(), ['CONFIRMED', 'PRE_ENROLLED'])
  })
})
