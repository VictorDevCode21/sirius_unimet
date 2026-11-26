import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { prisma, temporaryTermName } from './admin-db'
import { closeTerm, createTerm, findTermById, openTerm } from '@/data-access/repositories/term-management.repository'
import { DomainError } from '@/domain/shared/domain-error'
import { validateCanOpenTerm } from '@/domain/terms/term-rules'

// The seed always leaves one open term, so opening a temporary term exercises the blocking path.
describe('enrollment window', () => {
  const name = temporaryTermName()
  let termId: string

  before(async () => {
    const term = await createTerm({ name, startsAt: new Date('2091-01-08T00:00:00Z'), endsAt: new Date('2091-04-05T00:00:00Z') })
    termId = term!.id
  })

  after(async () => {
    await prisma.term.deleteMany({ where: { name } })
    await prisma.$disconnect()
  })

  it('blocks opening a term while another one is open and leaves it closed', async () => {
    await assert.rejects(
      openTerm(termId, (term, open) => validateCanOpenTerm({ ...term, ratePerCredit: 45, maxCredits: 21 }, open, new Date())),
      DomainError,
    )
    assert.equal((await findTermById(termId))?.open, false)
  })

  it('returns null for an unknown term', async () => {
    const unknown = '00000000-0000-4000-8000-000000000000'
    assert.equal(await openTerm(unknown, () => {}), null)
    assert.equal(await closeTerm(unknown), null)
  })
})
