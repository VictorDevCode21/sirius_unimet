import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { prisma, temporaryTermName } from './admin-db'
import { createTerm, listTerms } from '@/data-access/repositories/term-management.repository'

describe('term creation', () => {
  const name = temporaryTermName()
  const dates = { startsAt: new Date('2090-01-08T00:00:00Z'), endsAt: new Date('2090-04-05T00:00:00Z') }

  after(async () => {
    await prisma.term.deleteMany({ where: { name } })
    await prisma.$disconnect()
  })

  it('creates the term closed and lists it with name, dates and status', async () => {
    const created = await createTerm({ name, ...dates })
    assert.equal(created?.open, false)

    const listed = (await listTerms()).find((term) => term.name === name)
    assert.equal(listed?.open, false)
    assert.equal(listed?.startsAt.toISOString(), dates.startsAt.toISOString())
    assert.equal(listed?.endsAt.toISOString(), dates.endsAt.toISOString())
  })

  it('returns null for a repeated name', async () => {
    assert.equal(await createTerm({ name, ...dates }), null)
  })
})
