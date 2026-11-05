import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { enrollTemporaryStudents, findSeedFixtures, prisma, removeTemporaryStudents } from './db'
import {
  addScheduleBlocksWithLock,
  createSection,
  removeScheduleBlockWithLock,
  updateSectionWithLock,
} from '@/data-access/repositories/section-management.repository'
import { findOfferByTerm } from '@/data-access/repositories/section.repository'
import { validateNoOverlapInSection, validateProfessorAvailability, validateScheduleChangeAllowed } from '@/domain/sections/schedule-rules'
import { nextSectionNumber, validateSectionCapacity } from '@/domain/sections/section-rules'

const sectionIds: string[] = []
let studentIds: string[] = []
let fixtures: Awaited<ReturnType<typeof findSeedFixtures>>
let subjectId: string
let professorId: string
let otherProfessorId: string

// Throwaway professors without other sections, so the tests own their whole week.
async function temporaryProfessor(label: string) {
  const professor = await prisma.user.create({
    data: { name: `Profesor ${label}`, email: `prof-${label}-${Date.now()}@test.local`, passwordHash: 'x', role: 'PROFESSOR' },
  })
  return professor.id
}

const saturday = (start: number, end: number) => ({ weekday: 'SAT' as const, startMinutes: start * 60, endMinutes: end * 60 })

const assertFor = (block: ReturnType<typeof saturday>) => (state: { occupied: number; ownBlocks: never[] | { weekday: string; startMinutes: number; endMinutes: number }[]; professorBlocks: Parameters<typeof validateProfessorAvailability>[1] }) => {
  validateScheduleChangeAllowed(state.occupied)
  validateNoOverlapInSection(state.ownBlocks, block)
  validateProfessorAvailability('Profesor', state.professorBlocks, [block])
}

async function newSection(professor = professorId) {
  const section = await createSection({ subjectId, termId: fixtures.openTerm.id, professorId: professor, capacity: 20, nextNumber: nextSectionNumber })
  sectionIds.push(section.id)
  return section
}

before(async () => {
  fixtures = await findSeedFixtures()
  const career = await prisma.career.findUniqueOrThrow({ where: { name: 'Ingeniería en Sistemas' } })
  subjectId = (await prisma.subject.findFirstOrThrow({ where: { careerId: career.id, term: 1 }, orderBy: { code: 'asc' } })).id
  professorId = await temporaryProfessor('a')
  otherProfessorId = await temporaryProfessor('b')
})

after(async () => {
  await removeTemporaryStudents(studentIds)
  await prisma.section.deleteMany({ where: { id: { in: sectionIds } } })
  await prisma.user.deleteMany({ where: { id: { in: [professorId, otherProfessorId] } } })
  await prisma.$disconnect()
})

describe('HU-11 schedule blocks (database)', () => {
  it('stores a valid block and the student offer reads it', async () => {
    const section = await newSection()
    const block = saturday(8, 10)
    assert.ok(await addScheduleBlocksWithLock({ sectionId: section.id, blocks: [block], assertAllowed: assertFor(block) }))

    const offer = await findOfferByTerm(fixtures.openTerm.id, (await prisma.subject.findUniqueOrThrow({ where: { id: subjectId } })).careerId)
    const offered = offer.find((item) => item.id === section.id)
    assert.ok(offered)
    assert.equal(offered.scheduleBlocks.length, 1)
    assert.equal(offered.scheduleBlocks[0].weekday, 'SAT')
    assert.equal(offered.scheduleBlocks[0].startTime.getUTCHours(), 8)
    assert.equal(offered.scheduleBlocks[0].endTime.getUTCHours(), 10)
  })

  it('rejects an overlapping block in the same section', async () => {
    const section = await newSection()
    const first = saturday(11, 13)
    await addScheduleBlocksWithLock({ sectionId: section.id, blocks: [first], assertAllowed: assertFor(first) })
    const overlapping = saturday(12, 14)
    await assert.rejects(addScheduleBlocksWithLock({ sectionId: section.id, blocks: [overlapping], assertAllowed: assertFor(overlapping) }), /solapa/)
  })

  it('rejects a block that clashes with another section of the same professor', async () => {
    const busy = await newSection()
    const block = saturday(15, 17)
    await addScheduleBlocksWithLock({ sectionId: busy.id, blocks: [block], assertAllowed: assertFor(block) })
    const other = await newSection()
    await assert.rejects(addScheduleBlocksWithLock({ sectionId: other.id, blocks: [saturday(16, 18)], assertAllowed: assertFor(saturday(16, 18)) }), /ya dicta/)
  })

  it('rejects moving a section to a professor who is busy at that time', async () => {
    const otherProfessor = otherProfessorId
    const theirs = await newSection(otherProfessor)
    const block = saturday(19, 21)
    await addScheduleBlocksWithLock({ sectionId: theirs.id, blocks: [block], assertAllowed: assertFor(block) })
    const mine = await newSection()
    await addScheduleBlocksWithLock({ sectionId: mine.id, blocks: [block], assertAllowed: assertFor(block) })
    await assert.rejects(
      updateSectionWithLock({
        sectionId: mine.id,
        professorId: otherProfessor,
        capacity: 20,
        number: mine.number,
        assertCapacity: validateSectionCapacity,
        assertProfessorAvailable: (professorBlocks, sectionBlocks) => validateProfessorAvailability('Otro', professorBlocks, sectionBlocks),
      }),
      /ya dicta/,
    )
  })

  it('does not change the schedule of a section with enrolled students', async () => {
    const section = await newSection()
    const block = saturday(7, 8)
    const created = await addScheduleBlocksWithLock({ sectionId: section.id, blocks: [block], assertAllowed: assertFor(block) })
    studentIds = studentIds.concat(await enrollTemporaryStudents(section.id, fixtures.openTerm.id, 1))
    await assert.rejects(addScheduleBlocksWithLock({ sectionId: section.id, blocks: [saturday(9, 10)], assertAllowed: assertFor(saturday(9, 10)) }), /inscrito/)
    await assert.rejects(removeScheduleBlockWithLock({ sectionId: section.id, blockId: created![0].id, assertAllowed: validateScheduleChangeAllowed }), /inscrito/)
  })

  it('removes a block and ignores blocks of other sections', async () => {
    const section = await newSection()
    const block = saturday(13, 14)
    const created = await addScheduleBlocksWithLock({ sectionId: section.id, blocks: [block], assertAllowed: assertFor(block) })
    const other = await newSection()
    assert.equal(await removeScheduleBlockWithLock({ sectionId: other.id, blockId: created![0].id, assertAllowed: validateScheduleChangeAllowed }), false)
    assert.equal(await removeScheduleBlockWithLock({ sectionId: section.id, blockId: created![0].id, assertAllowed: validateScheduleChangeAllowed }), true)
    assert.equal(await prisma.scheduleBlock.count({ where: { sectionId: section.id } }), 0)
  })
})
