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
  it('matches the confirmed enrollments of the seeded student section in the current term', async () => {
    const currentTerm = await prisma.term.findUniqueOrThrow({ where: { name: '2627-1' } })
    const detail = await prisma.enrollmentDetail.findFirstOrThrow({
      where: { enrollment: { studentId: fixtures.student.id, termId: currentTerm.id } },
      select: { sectionId: true },
    })
    const sections = await listDepartmentSections(fixtures.department.id, currentTerm.id)
    const section = sections.find((item) => item.id === detail.sectionId)
    assert.ok(section)
    const occupancy = occupancyOf(section)
    const confirmed = await prisma.enrollmentDetail.count({ where: { sectionId: section.id, enrollment: { status: 'CONFIRMED' } } })
    assert.equal(occupancy.enrolled, confirmed)
    assert.equal(occupancy.available, Math.max(0, section.capacity - confirmed))
    const students = await listSectionStudents(section.id)
    assert.equal(students.length, await prisma.enrollmentDetail.count({ where: { sectionId: section.id } }))
    assert.ok(students.some((student) => student.enrollment.student.id === fixtures.student.id))
  })

  it('lists pre-enrolled students without taking seats and handles a section without students', async () => {
    const subject = await prisma.subject.findFirstOrThrow({ where: { career: { departmentId: fixtures.department.id } }, orderBy: { code: 'asc' } })
    // Explicit numbers keep this file from competing with other section tests for the next free number.
    const busy = await createSection({ subjectId: subject.id, termId: fixtures.openTerm.id, professorId: fixtures.professor.id, capacity: 3, number: 61, nextNumber: nextSectionNumber })
    const empty = await createSection({ subjectId: subject.id, termId: fixtures.openTerm.id, professorId: fixtures.professor.id, capacity: 10, number: 62, nextNumber: nextSectionNumber })
    sectionIds.push(busy.id, empty.id)
    studentIds = await enrollTemporaryStudents(busy.id, fixtures.openTerm.id, 3)

    const sections = await listDepartmentSections(fixtures.department.id, fixtures.openTerm.id)
    const busyOccupancy = occupancyOf(sections.find((section) => section.id === busy.id)!)
    assert.deepEqual([busyOccupancy.enrolled, busyOccupancy.unpaid, busyOccupancy.available, busyOccupancy.full], [0, 3, 3, false])
    const emptyOccupancy = occupancyOf(sections.find((section) => section.id === empty.id)!)
    assert.deepEqual([emptyOccupancy.enrolled, emptyOccupancy.available], [0, 10])
    assert.equal((await listSectionStudents(empty.id)).length, 0)
    assert.equal((await listSectionStudents(busy.id)).length, 3)
  })

  it('fills and flags a section with confirmed enrollments', async () => {
    const subject = await prisma.subject.findFirstOrThrow({ where: { career: { departmentId: fixtures.department.id } }, orderBy: { code: 'asc' } })
    const section = await createSection({ subjectId: subject.id, termId: fixtures.openTerm.id, professorId: fixtures.professor.id, capacity: 3, number: 63, nextNumber: nextSectionNumber })
    sectionIds.push(section.id)
    studentIds = studentIds.concat(await enrollTemporaryStudents(section.id, fixtures.openTerm.id, 3, 'CONFIRMED'))

    const sections = await listDepartmentSections(fixtures.department.id, fixtures.openTerm.id)
    const occupancy = occupancyOf(sections.find((item) => item.id === section.id)!)
    assert.deepEqual([occupancy.enrolled, occupancy.available, occupancy.full, occupancy.nearlyFull], [3, 0, true, true])
  })
})
