import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { enrollTemporaryStudents, findSeedFixtures, prisma, removeTemporaryStudents } from './db'
import { createSection, deleteSectionWithLock, updateSectionWithLock } from '@/data-access/repositories/section-management.repository'
import { nextSectionNumber, validateSectionCapacity, validateSectionDeletable } from '@/domain/sections/section-rules'
import { DomainError } from '@/domain/shared/domain-error'

const sectionIds: string[] = []
let studentIds: string[] = []
let fixtures: Awaited<ReturnType<typeof findSeedFixtures>>
let subjectId: string

async function newSection(capacity = 20) {
  const section = await createSection({ subjectId, termId: fixtures.openTerm.id, professorId: fixtures.professor.id, capacity, nextNumber: nextSectionNumber })
  sectionIds.push(section.id)
  await prisma.scheduleBlock.create({
    data: { sectionId: section.id, weekday: 'SAT', startTime: new Date(Date.UTC(1970, 0, 1, 8)), endTime: new Date(Date.UTC(1970, 0, 1, 10)) },
  })
  return section
}

before(async () => {
  fixtures = await findSeedFixtures()
  subjectId = (await prisma.subject.findFirstOrThrow({ where: { career: { departmentId: fixtures.department.id } }, orderBy: { code: 'desc' } })).id
})

after(async () => {
  await removeTemporaryStudents(studentIds)
  await prisma.section.deleteMany({ where: { id: { in: sectionIds } } })
  await prisma.$disconnect()
})

describe('HU-10B edit and delete sections', () => {
  it('rejects deleting a section with enrolled students or grades', () => {
    assert.throws(() => validateSectionDeletable(1, 0), /inscrito/)
    assert.throws(() => validateSectionDeletable(0, 3), /calificaciones/)
    assert.doesNotThrow(() => validateSectionDeletable(0, 0))
  })

  it('persists professor, capacity and number changes', async () => {
    const section = await newSection()
    const otherProfessor = await prisma.user.findFirstOrThrow({ where: { role: 'PROFESSOR', id: { not: fixtures.professor.id } } })
    await updateSectionWithLock({ sectionId: section.id, professorId: otherProfessor.id, capacity: 42, number: 77, assertCapacity: validateSectionCapacity })
    const stored = await prisma.section.findUniqueOrThrow({ where: { id: section.id } })
    assert.deepEqual([stored.professorId, stored.capacity, stored.number], [otherProfessor.id, 42, 77])
  })

  it('does not lower capacity below the enrolled students', async () => {
    const section = await newSection(5)
    studentIds = studentIds.concat(await enrollTemporaryStudents(section.id, fixtures.openTerm.id, 3))
    await assert.rejects(
      updateSectionWithLock({ sectionId: section.id, professorId: fixtures.professor.id, capacity: 2, number: section.number, assertCapacity: validateSectionCapacity }),
      DomainError,
    )
    assert.equal((await prisma.section.findUniqueOrThrow({ where: { id: section.id } })).capacity, 5)
  })

  it('keeps a section with enrollments and its enrollment details', async () => {
    const section = await newSection()
    studentIds = studentIds.concat(await enrollTemporaryStudents(section.id, fixtures.openTerm.id, 1))
    await assert.rejects(deleteSectionWithLock(section.id, validateSectionDeletable), /no se puede eliminar/)
    assert.ok(await prisma.section.findUnique({ where: { id: section.id } }))
    assert.equal(await prisma.enrollmentDetail.count({ where: { sectionId: section.id } }), 1)
  })

  it('deletes an empty section with its schedule blocks', async () => {
    const section = await newSection()
    assert.equal(await deleteSectionWithLock(section.id, validateSectionDeletable), true)
    assert.equal(await prisma.section.findUnique({ where: { id: section.id } }), null)
    assert.equal(await prisma.scheduleBlock.count({ where: { sectionId: section.id } }), 0)
  })

  it('reports a missing section without throwing', async () => {
    const missing = '00000000-0000-4000-8000-000000000000'
    assert.equal(await deleteSectionWithLock(missing, validateSectionDeletable), false)
    assert.equal(await updateSectionWithLock({ sectionId: missing, professorId: fixtures.professor.id, capacity: 10, number: 1, assertCapacity: validateSectionCapacity }), null)
  })
})
