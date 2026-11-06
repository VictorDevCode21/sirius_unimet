import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { prisma, temporaryTermName } from './admin-db'
import { createTerm, findTermById, updateMaxCredits } from '@/data-access/repositories/term-management.repository'

describe('max credits', () => {
  const name = temporaryTermName()

  after(async () => {
    await prisma.term.deleteMany({ where: { name } })
    await prisma.$disconnect()
  })

  it('persists the value on the term that enrollment validation reads', async () => {
    const term = await createTerm({ name, startsAt: new Date('2093-01-08T00:00:00Z'), endsAt: new Date('2093-04-05T00:00:00Z') })
    assert.equal(term?.maxCredits, 0)

    await updateMaxCredits(term!.id, 18)
    assert.equal((await findTermById(term!.id))?.maxCredits, 18)
  })

  it('returns null for an unknown term', async () => {
    assert.equal(await updateMaxCredits('00000000-0000-4000-8000-000000000000', 18), null)
  })
})
