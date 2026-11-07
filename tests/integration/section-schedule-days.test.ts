import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { findSeedFixtures, prisma } from './db'
import { addScheduleBlocksWithLock, createSection } from '@/data-access/repositories/section-management.repository'
import { buildWeeklyBlocks, validateNoOverlapInSection, validateProfessorAvailability, validateScheduleChangeAllowed } from '@/domain/sections/schedule-rules'
import { nextSectionNumber } from '@/domain/sections/section-rules'

const sectionIds: string[] = []
let professorId: string
let subjectId: string
let termId: string

type Block = { weekday: string; startMinutes: number; endMinutes: number }

const assertAll =
  (blocks: Block[]) =>
  (state: { occupied: number; ownBlocks: Block[]; professorBlocks: Parameters<typeof validateProfessorAvailability>[1] }) => {
    validateScheduleChangeAllowed(state.occupied)
    blocks.forEach((block) => validateNoOverlapInSection(state.ownBlocks, block))
    validateProfessorAvailability('Profesor', state.professorBlocks, blocks)
  }

async function newSection() {
  const section = await createSection({ subjectId, termId, professorId, capacity: 20, nextNumber: nextSectionNumber })
  sectionIds.push(section.id)
  return section
}

before(async () => {
  const fixtures = await findSeedFixtures()
  termId = fixtures.openTerm.id
  const career = await prisma.career.findUniqueOrThrow({ where: { name: 'Ingeniería en Sistemas' } })
  subjectId = (await prisma.subject.findFirstOrThrow({ where: { careerId: career.id, term: 1 }, orderBy: { code: 'asc' } })).id
  const professor = await prisma.user.create({
    data: { name: 'Profesor días', email: `prof-days-${Date.now()}@test.local`, passwordHash: 'x', role: 'PROFESSOR' },
  })
  professorId = professor.id
})

after(async () => {
  await prisma.section.deleteMany({ where: { id: { in: sectionIds } } })
  await prisma.user.deleteMany({ where: { id: professorId } })
  await prisma.$disconnect()
})

describe('HU-11 schedule blocks on several days (database)', () => {
  it('stores one block per chosen day in a single operation', async () => {
    const section = await newSection()
    const blocks = buildWeeklyBlocks(['MON', 'WED'], 14 * 60, 15 * 60 + 30)
    const created = await addScheduleBlocksWithLock({ sectionId: section.id, blocks, assertAllowed: assertAll(blocks) })
    assert.equal(created?.length, 2)
    const stored = await prisma.scheduleBlock.findMany({ where: { sectionId: section.id }, orderBy: { weekday: 'asc' } })
    assert.deepEqual(
      stored.map((block) => [block.weekday, block.startTime.getUTCHours(), block.startTime.getUTCMinutes(), block.endTime.getUTCHours(), block.endTime.getUTCMinutes()]),
      [
        ['MON', 14, 0, 15, 30],
        ['WED', 14, 0, 15, 30],
      ],
    )
  })

  it('stores no block when one of the chosen days clashes with the professor', async () => {
    const busy = await newSection()
    const thursday = buildWeeklyBlocks(['THU'], 9 * 60, 11 * 60)
    await addScheduleBlocksWithLock({ sectionId: busy.id, blocks: thursday, assertAllowed: assertAll(thursday) })

    const other = await newSection()
    const tuesdayThursday = buildWeeklyBlocks(['TUE', 'THU'], 10 * 60, 12 * 60)
    await assert.rejects(addScheduleBlocksWithLock({ sectionId: other.id, blocks: tuesdayThursday, assertAllowed: assertAll(tuesdayThursday) }), /ya dicta/)
    assert.equal(await prisma.scheduleBlock.count({ where: { sectionId: other.id } }), 0)
  })
})
