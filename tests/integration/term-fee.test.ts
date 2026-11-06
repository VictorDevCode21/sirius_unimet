import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { prisma, temporaryTermName, uniqueSuffix } from './admin-db'
import { createTerm, updateRatePerCredit } from '@/data-access/repositories/term-management.repository'
import { repriceEnrollment } from '@/domain/billing/repricing'

describe('fee change', () => {
  const name = temporaryTermName()
  const studentIds: string[] = []
  let termId: string
  let sectionId: string
  let credits: number

  const createEnrollment = async (status: 'PRE_ENROLLED' | 'CONFIRMED', amount: number) => {
    const student = await prisma.user.create({
      data: { name: 'Estudiante prueba', email: `fee-${uniqueSuffix()}@test.local`, passwordHash: 'x', role: 'STUDENT' },
    })
    studentIds.push(student.id)
    return prisma.enrollment.create({ data: { studentId: student.id, termId, status, amount, details: { create: { sectionId } } } })
  }

  before(async () => {
    const term = await createTerm({ name, startsAt: new Date('2092-01-08T00:00:00Z'), endsAt: new Date('2092-04-05T00:00:00Z') })
    termId = term!.id
    const subject = await prisma.subject.findFirstOrThrow()
    const professor = await prisma.user.findFirstOrThrow({ where: { role: 'PROFESSOR' } })
    credits = subject.credits
    const section = await prisma.section.create({ data: { number: 1, capacity: 10, subjectId: subject.id, termId, professorId: professor.id } })
    sectionId = section.id
  })

  after(async () => {
    await prisma.enrollment.deleteMany({ where: { termId } })
    await prisma.section.deleteMany({ where: { termId } })
    await prisma.term.deleteMany({ where: { id: termId } })
    await prisma.user.deleteMany({ where: { id: { in: studentIds } } })
    await prisma.$disconnect()
  })

  it('reprices unpaid enrollments and keeps paid ones', async () => {
    const paid = await createEnrollment('CONFIRMED', 123.45)
    const unpaid = await createEnrollment('PRE_ENROLLED', 1)

    const term = await updateRatePerCredit(termId, 50, (enrollment) => repriceEnrollment(enrollment, 50))
    assert.equal(Number(term?.ratePerCredit), 50)

    const amountOf = async (id: string) => Number((await prisma.enrollment.findUniqueOrThrow({ where: { id } })).amount)
    assert.equal(await amountOf(paid.id), 123.45)
    assert.equal(await amountOf(unpaid.id), credits * 50)
  })

  it('returns null for an unknown term', async () => {
    assert.equal(await updateRatePerCredit('00000000-0000-4000-8000-000000000000', 50, () => 0), null)
  })
})
