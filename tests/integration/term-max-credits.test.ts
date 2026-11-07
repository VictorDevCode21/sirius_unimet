import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { prisma, temporaryTermName, uniqueSuffix } from './admin-db'
import { createTerm, findTermById, updateMaxCredits } from '@/data-access/repositories/term-management.repository'
import { DomainError } from '@/domain/shared/domain-error'
import { validateMaxCreditsChange } from '@/domain/terms/term-rules'

const saveWithRule = (termId: string, maxCredits: number) =>
  updateMaxCredits(termId, maxCredits, (enrollmentCredits) => validateMaxCreditsChange(maxCredits, enrollmentCredits))

describe('max credits', () => {
  const name = temporaryTermName()
  const studentIds: string[] = []
  let termId: string
  const sectionIds: string[] = []
  let sectionCredits = 0

  const createEnrollment = async (status: 'PRE_ENROLLED' | 'PENDING' | 'CONFIRMED') => {
    const student = await prisma.user.create({
      data: { name: 'Estudiante prueba', email: `max-${uniqueSuffix()}@test.local`, passwordHash: 'x', role: 'STUDENT' },
    })
    studentIds.push(student.id)
    return prisma.enrollment.create({
      data: { studentId: student.id, termId, status, details: { create: sectionIds.map((sectionId) => ({ sectionId })) } },
    })
  }

  before(async () => {
    const term = await createTerm({ name, startsAt: new Date('2093-01-08T00:00:00Z'), endsAt: new Date('2093-04-05T00:00:00Z') })
    termId = term!.id
    const subjects = await prisma.subject.findMany({ take: 2, orderBy: { code: 'asc' } })
    const professor = await prisma.user.findFirstOrThrow({ where: { role: 'PROFESSOR' } })
    for (const subject of subjects) {
      const section = await prisma.section.create({ data: { number: 1, capacity: 10, subjectId: subject.id, termId, professorId: professor.id } })
      sectionIds.push(section.id)
      sectionCredits += subject.credits
    }
  })

  after(async () => {
    await prisma.enrollment.deleteMany({ where: { termId } })
    await prisma.section.deleteMany({ where: { termId } })
    await prisma.term.deleteMany({ where: { id: termId } })
    await prisma.user.deleteMany({ where: { id: { in: studentIds } } })
    await prisma.$disconnect()
  })

  it('persists the value on the term that enrollment validation reads', async () => {
    assert.equal((await findTermById(termId))?.maxCredits, 0)
    await saveWithRule(termId, 18)
    assert.equal((await findTermById(termId))?.maxCredits, 18)
  })

  it('rejects a max below the credits of unpaid enrollments and keeps the previous value', async () => {
    await createEnrollment('PRE_ENROLLED')
    await createEnrollment('PENDING')
    await saveWithRule(termId, 21)

    await assert.rejects(saveWithRule(termId, sectionCredits - 1), (error: unknown) => {
      assert.ok(error instanceof DomainError)
      assert.match(error.message, new RegExp(`a ${sectionCredits - 1} UC: 2 pre-inscripciones del período tienen más créditos`))
      return true
    })
    assert.equal((await findTermById(termId))?.maxCredits, 21)
  })

  it('ignores confirmed enrollments and accepts a max equal to the largest selection', async () => {
    await prisma.enrollment.updateMany({ where: { termId }, data: { status: 'CONFIRMED' } })
    await saveWithRule(termId, sectionCredits - 1)
    assert.equal((await findTermById(termId))?.maxCredits, sectionCredits - 1)

    await createEnrollment('PRE_ENROLLED')
    await saveWithRule(termId, sectionCredits)
    assert.equal((await findTermById(termId))?.maxCredits, sectionCredits)
  })

  it('returns null for an unknown term', async () => {
    assert.equal(await saveWithRule('00000000-0000-4000-8000-000000000000', 18), null)
  })
})
