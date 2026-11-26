import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { findSeedFixtures, prisma } from './db'
import {
  createSection,
  findDepartmentSection,
  findSubjectInDepartment,
  isUniqueViolation,
  listDepartmentSections,
} from '@/data-access/repositories/section-management.repository'
import { nextSectionNumber } from '@/domain/sections/section-rules'

const createdIds: string[] = []
let fixtures: Awaited<ReturnType<typeof findSeedFixtures>>
let subjectId: string

before(async () => {
  fixtures = await findSeedFixtures()
  const subject = await prisma.subject.findFirstOrThrow({ where: { career: { departmentId: fixtures.department.id } }, orderBy: { code: 'asc' } })
  subjectId = subject.id
})

after(async () => {
  await prisma.section.deleteMany({ where: { id: { in: createdIds } } })
  await prisma.$disconnect()
})

describe('HU-10A create section (database)', () => {
  it('stores a valid section with the next free number and lists it in the term', async () => {
    const existing = await prisma.section.findMany({ where: { subjectId, termId: fixtures.openTerm.id }, select: { number: true } })
    const section = await createSection({
      subjectId,
      termId: fixtures.openTerm.id,
      professorId: fixtures.professor.id,
      capacity: 25,
      nextNumber: nextSectionNumber,
    })
    createdIds.push(section.id)
    assert.equal(section.number, nextSectionNumber(existing.map((item) => item.number)))

    const listed = await listDepartmentSections(fixtures.department.id, fixtures.openTerm.id)
    const found = listed.find((item) => item.id === section.id)
    assert.ok(found)
    assert.equal(found.capacity, 25)
    assert.equal(found.professor.id, fixtures.professor.id)
    assert.equal(found._count.enrollmentDetails, 0)
  })

  it('rejects a duplicated section number with a unique violation', async () => {
    const first = await createSection({ subjectId, termId: fixtures.openTerm.id, professorId: fixtures.professor.id, capacity: 10, number: 90, nextNumber: nextSectionNumber })
    createdIds.push(first.id)
    await assert.rejects(
      createSection({ subjectId, termId: fixtures.openTerm.id, professorId: fixtures.professor.id, capacity: 10, number: 90, nextNumber: nextSectionNumber }),
      (error) => isUniqueViolation(error),
    )
  })

  it('does not expose subjects or sections of other departments', async () => {
    const otherDepartment = await prisma.department.create({ data: { name: `Test dept ${Date.now()}` } })
    try {
      assert.equal(await findSubjectInDepartment(subjectId, otherDepartment.id), null)
      assert.equal((await listDepartmentSections(otherDepartment.id, fixtures.openTerm.id)).length, 0)
      assert.equal(await findDepartmentSection(createdIds[0], otherDepartment.id), null)
    } finally {
      await prisma.department.delete({ where: { id: otherDepartment.id } })
    }
  })
})
