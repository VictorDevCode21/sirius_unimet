import 'dotenv/config'
import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { checkEnrollmentSeats, confirmEnrollmentSeats } from '@/control/controllers/enrollment-seats'
import { prisma } from '@/data-access/prisma'
import { addSectionWithSeatLock } from '@/data-access/repositories/enrollment.repository'
import { validateCapacity } from '@/domain/enrollment/enrollment-validator'
import { DomainError } from '@/domain/shared/domain-error'

const PREFIX = 'seat-lock-test'
const time = (hours: number, minutes = 0) => new Date(Date.UTC(1970, 0, 1, hours, minutes))

let termId: string
let subjectId: string
let lastSeatSectionId: string

async function createStudent(index: number) {
  const subject = await prisma.subject.findUniqueOrThrow({ where: { id: subjectId } })
  const student = await prisma.user.create({
    data: { email: `${PREFIX}-${index}@test.local`, name: `Seat ${index}`, passwordHash: 'x', role: 'STUDENT', careerId: subject.careerId },
  })
  return student
}

async function preEnroll(studentId: string, sectionId: string) {
  return prisma.enrollment.create({ data: { studentId, termId, details: { create: { sectionId } } } })
}

// Confirms an enrollment the way the payment flow does: takes the seats and sets the status in one transaction.
function confirmLikePayment(enrollmentId: string) {
  return prisma.$transaction(async (tx) => {
    await confirmEnrollmentSeats(enrollmentId, tx)
    await new Promise((resolve) => setTimeout(resolve, 150))
    await tx.enrollment.update({ where: { id: enrollmentId }, data: { status: 'CONFIRMED' } })
  })
}

async function cleanUp() {
  await prisma.enrollment.deleteMany({ where: { student: { email: { startsWith: PREFIX } } } })
  await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } })
  await prisma.section.deleteMany({ where: { number: { in: [90, 91] }, termId } })
}

describe('seat lock', () => {
  before(async () => {
    const term = await prisma.term.findFirstOrThrow({ where: { open: true } })
    termId = term.id
    const professor = await prisma.user.findFirstOrThrow({ where: { role: 'PROFESSOR' } })
    const subject = await prisma.subject.findFirstOrThrow({ where: { code: 'FPTSP27' } })
    subjectId = subject.id
    await cleanUp()
    const lastSeat = await prisma.section.create({
      data: {
        number: 90,
        capacity: 1,
        termId,
        subjectId,
        professorId: professor.id,
        scheduleBlocks: { create: { weekday: 'SAT', startTime: time(8), endTime: time(10) } },
      },
    })
    lastSeatSectionId = lastSeat.id
    await prisma.section.create({
      data: {
        number: 91,
        capacity: 3,
        termId,
        subjectId,
        professorId: professor.id,
        scheduleBlocks: { create: { weekday: 'SAT', startTime: time(10, 30), endTime: time(12, 30) } },
      },
    })
  })

  after(async () => {
    await cleanUp()
    await prisma.$disconnect()
  })

  it('gives the last seat to only one of two simultaneous confirmations and suggests another section to the other', async () => {
    const [first, second] = await Promise.all([createStudent(1), createStudent(2)])
    const enrollments = await Promise.all([preEnroll(first.id, lastSeatSectionId), preEnroll(second.id, lastSeatSectionId)])

    const results = await Promise.allSettled(enrollments.map((enrollment) => confirmLikePayment(enrollment.id)))

    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1)
    const rejected = results.find((result) => result.status === 'rejected') as PromiseRejectedResult
    assert.ok(rejected.reason instanceof DomainError)
    assert.match(rejected.reason.message, /^La sección 90 de Análisis de Datos se llenó\. Te sugerimos la sección (?!90\b)\d+ \(.+\), que tiene \d+ cupos?\.$/)
    const confirmed = await prisma.enrollment.count({ where: { id: { in: enrollments.map((item) => item.id) }, status: 'CONFIRMED' } })
    assert.equal(confirmed, 1)
  })

  it('reports a full section with an alternative before payment without taking seats', async () => {
    const student = await createStudent(3)
    const enrollment = await preEnroll(student.id, lastSeatSectionId)
    const fullSections = await checkEnrollmentSeats(prisma, enrollment.id, { lock: false })
    assert.equal(fullSections.length, 1)
    assert.notEqual(fullSections[0].alternative, null)
    assert.notEqual(fullSections[0].alternative?.number, 90)
    assert.ok((fullSections[0].alternative?.seatsLeft ?? 0) > 0)
    assert.equal(await prisma.enrollment.count({ where: { id: enrollment.id, status: 'PRE_ENROLLED' } }), 1)
  })

  it('does not let a full section be added to a pre-enrollment', async () => {
    const student = await createStudent(4)
    await assert.rejects(
      addSectionWithSeatLock({
        studentId: student.id,
        termId,
        sectionId: lastSeatSectionId,
        assertSeatAvailable: validateCapacity,
        computeAmount: (credits) => credits * 10,
      }),
      /La sección está llena/,
    )
  })
})
