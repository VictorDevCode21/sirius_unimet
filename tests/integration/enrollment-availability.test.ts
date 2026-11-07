import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { prisma, temporaryTermName } from './admin-db'
import { findNextTerm, findOpenTerm } from '@/data-access/repositories/term.repository'
import { describeEnrollmentAvailability } from '@/domain/terms/term-rules'

// Reads the availability shown in the student portal from the database. The seeded open term is left untouched so
// other test files running at the same time are not affected; the closed state uses a temporary future term.
describe('student enrollment availability', () => {
  const name = temporaryTermName()

  before(async () => {
    await prisma.term.create({ data: { name, startsAt: new Date('2090-01-08T00:00:00Z'), endsAt: new Date('2090-04-05T00:00:00Z') } })
  })

  after(async () => {
    await prisma.term.deleteMany({ where: { name } })
    await prisma.$disconnect()
  })

  it('offers pre-enrollment for the seeded open term', async () => {
    const openTerm = await findOpenTerm()
    const availability = describeEnrollmentAvailability(openTerm, await findNextTerm(new Date()))
    assert.deepEqual(availability, { isOpen: true, termName: openTerm?.name, nextTerm: null })
  })

  it('gives the dates of the earliest term not started yet when no term is open', async () => {
    const availability = describeEnrollmentAvailability(null, await findNextTerm(new Date('2089-12-31T00:00:00Z')))
    assert.equal(availability.isOpen, false)
    assert.equal(availability.nextTerm?.name, name)
    assert.equal(availability.nextTerm?.startsAt.toISOString(), '2090-01-08T00:00:00.000Z')
  })
})
