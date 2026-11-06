import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { maxCreditsSchema } from '@/control/validation/term.schema'
import { validateMaxCredits, type SectionCandidate } from '@/domain/enrollment/enrollment-validator'
import { DomainError } from '@/domain/shared/domain-error'

const section = (id: string, credits: number): SectionCandidate => ({ id, subjectId: id, subjectName: id, credits, blocks: [] })

describe('maxCreditsSchema', () => {
  const termId = '00000000-0000-4000-8000-000000000000'

  it('accepts a positive integer', () => {
    assert.equal(maxCreditsSchema.parse({ termId, maxCredits: '21' }).maxCredits, 21)
  })

  it('rejects zero, negative, empty, decimal and non-numeric values', () => {
    for (const maxCredits of ['0', '-3', '', ' ', '1.5', 'abc', '100']) {
      assert.equal(maxCreditsSchema.safeParse({ termId, maxCredits }).success, false, maxCredits)
    }
  })
})

describe('enrollment against the saved max credits', () => {
  it('uses the max it receives, so a changed value applies to the next selection', () => {
    const selected = [section('a', 12)]
    assert.doesNotThrow(() => validateMaxCredits(selected, section('b', 6), 21))
    assert.throws(() => validateMaxCredits(selected, section('b', 6), 15), DomainError)
  })
})
