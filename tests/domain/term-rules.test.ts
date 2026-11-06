import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createTermSchema, parseDateOnly } from '@/control/validation/term.schema'
import { DomainError } from '@/domain/shared/domain-error'
import { validateTermDates } from '@/domain/terms/term-rules'

const utc = (value: string) => new Date(`${value}T00:00:00.000Z`)

describe('validateTermDates', () => {
  it('accepts an end date after the start date', () => {
    assert.doesNotThrow(() => validateTermDates(utc('2026-09-15'), utc('2026-12-15')))
  })

  it('rejects an end date before the start date', () => {
    assert.throws(() => validateTermDates(utc('2026-12-15'), utc('2026-09-15')), DomainError)
  })

  it('rejects an end date equal to the start date', () => {
    assert.throws(() => validateTermDates(utc('2026-09-15'), utc('2026-09-15')), DomainError)
  })
})

describe('createTermSchema', () => {
  const valid = { name: '2627-1', startsAt: '2026-09-15', endsAt: '2026-12-15' }

  it('parses dates at UTC midnight', () => {
    const parsed = createTermSchema.parse(valid)
    assert.equal(parsed.startsAt.toISOString(), '2026-09-15T00:00:00.000Z')
  })

  it('rejects names outside the trimester format', () => {
    for (const name of ['', 'trimestre', '2627', '2627-4']) {
      assert.equal(createTermSchema.safeParse({ ...valid, name }).success, false, name)
    }
  })

  it('rejects empty and impossible dates', () => {
    assert.equal(createTermSchema.safeParse({ ...valid, startsAt: '' }).success, false)
    assert.equal(parseDateOnly('2027-02-31'), null)
  })
})
