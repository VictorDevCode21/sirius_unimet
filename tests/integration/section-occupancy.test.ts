import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { enrollTemporaryStudents, findSeedFixtures, prisma, removeTemporaryStudents } from './db'
import { createSection, listDepartmentSections, listSectionStudents } from '@/data-access/repositories/section-management.repository'
import { computeOccupancy } from '@/domain/sections/occupancy'
import { nextSectionNumber } from '@/domain/sections/section-rules'

let fixtures: Awaited<ReturnType<typeof findSeedFixtures>>
let studentIds: string[] = []
const sectionIds: string[] = []

const occupancyOf = (section: Awaited<ReturnType<typeof listDepartmentSections>>[number]) =>
  computeOccupancy(section.capacity, section.enrollmentDetails.map((detail) => detail.enrollment.status))

before(async () => {
  fixtures = await findSeedFixtures()
})

after(async () => {
  await removeTemporaryStudents(studentIds)
  await prisma.section.deleteMany({ where: { id: { in: sectionIds } } })
  await prisma.$disconnect()
})

describe('HU-12 enrolled students and seats (database)', () => {
  it('matches the seeded confirmed enrollment of the current term', async () => {
    const currentTerm = await prisma.term.findUniqueOrThrow({ where: { name: '2627-1' } })
    const sections = await listDepartmentSections(fixtures.department.id, currentTerm.id)
    assert.ok(sections.length > 0)
    for (const section of sections) {
      const occupancy = occupancyOf(section)
      assert.equal(occupancy.enrolled, await prisma.enrollmentDetail.count({ where: { sectionId: section.id } }))
      assert.equal(occupancy.enrolled, occupancy.confirmed)
      assert.equal(occupancy.available, section.capacity - occupancy.enrolled)
    }
    const students = await listSectionStudents(sections[0].id)
    assert.equal(students.length, 1)
    assert.equal(students[0].enrollment.student.id, fixtures.student.id)
    assert.equal(students[0].enrollment.status, 'CONFIRMED')
  })

  it('counts pre-enrolled students as seat holders and handles a section without students', async () => {
    const subject = await prisma.subject.findFirstOrThrow({ where: { career: { departmentId: fixtures.department.id } }, orderBy: { code: 'asc' } })
    const busy = await createSection({ subjectId: subject.id, termId: fixtures.openTerm.id, professorId: fixtures.professor.id, capacity: 3, nextNumber: nextSectionNumber })
    const empty = await createSection({ subjectId: subject.id, termId: fixtures.openTerm.id, professorId: fixtures.professor.id, capacity: 10, nextNumber: nextSectionNumber })
    sectionIds.push(busy.id, empty.id)
    studentIds = await enrollTemporaryStudents(busy.id, fixtures.openTerm.id, 3)

    const sections = await listDepartmentSections(fixtures.department.id, fixtures.openTerm.id)
    const busyOccupancy = occupancyOf(sections.find((section) => section.id === busy.id)!)
    assert.deepEqual([busyOccupancy.enrolled, busyOccupancy.confirmed, busyOccupancy.available, busyOccupancy.full], [3, 0, 0, true])
    const emptyOccupancy = occupancyOf(sections.find((section) => section.id === empty.id)!)
    assert.deepEqual([emptyOccupancy.enrolled, emptyOccupancy.available], [0, 10])
    assert.equal((await listSectionStudents(empty.id)).length, 0)
    assert.equal((await listSectionStudents(busy.id)).length, 3)
  })
})
