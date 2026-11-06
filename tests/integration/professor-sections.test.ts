import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { prisma, temporaryTermName, uniqueSuffix } from './admin-db'
import { findSectionRoster, findSectionsByProfessor, findTeachingTerm } from '@/data-access/repositories/professor-section.repository'

describe('professor sections', () => {
  const name = temporaryTermName()
  const emails = [`confirmed-${uniqueSuffix()}@test.local`, `pre-${uniqueSuffix()}@test.local`]
  let termId: string
  let sectionId: string
  let professorId: string

  before(async () => {
    const term = await prisma.term.create({ data: { name, startsAt: new Date('2094-01-08T00:00:00Z'), endsAt: new Date('2094-04-05T00:00:00Z') } })
    termId = term.id
    const subject = await prisma.subject.findFirstOrThrow()
    const professor = await prisma.user.findFirstOrThrow({ where: { role: 'PROFESSOR' } })
    professorId = professor.id
    sectionId = (await prisma.section.create({ data: { number: 1, capacity: 10, subjectId: subject.id, termId, professorId } })).id

    for (const [index, email] of emails.entries()) {
      const student = await prisma.user.create({ data: { name: `Estudiante ${index}`, email, passwordHash: 'x', role: 'STUDENT', careerId: subject.careerId } })
      await prisma.enrollment.create({
        data: { studentId: student.id, termId, status: index === 0 ? 'CONFIRMED' : 'PRE_ENROLLED', details: { create: { sectionId } } },
      })
    }
  })

  after(async () => {
    await prisma.enrollment.deleteMany({ where: { termId } })
    await prisma.section.deleteMany({ where: { termId } })
    await prisma.term.deleteMany({ where: { id: termId } })
    await prisma.user.deleteMany({ where: { email: { in: emails } } })
    await prisma.$disconnect()
  })

  it('counts and lists only confirmed students', async () => {
    const [section] = await findSectionsByProfessor(professorId, termId)
    assert.equal(section._count.enrollmentDetails, 1)

    const roster = await findSectionRoster(sectionId)
    assert.equal(roster?.enrollmentDetails.length, 1)
    assert.equal(roster?.enrollmentDetails[0].enrollment.student.email, emails[0])
    assert.ok(roster?.enrollmentDetails[0].enrollment.student.career?.name)
  })

  it('returns no sections for a professor without assignments in the term', async () => {
    assert.deepEqual(await findSectionsByProfessor('00000000-0000-4000-8000-000000000000', termId), [])
  })

  it('uses the term in progress, and the latest started term between terms', async () => {
    assert.equal((await findTeachingTerm(new Date('2094-02-01T00:00:00Z')))?.name, name)
    assert.equal((await findTeachingTerm(new Date('2094-05-01T00:00:00Z')))?.name, name)
  })
})
