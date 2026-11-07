import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createTermSchema, parseDateOnly } from '@/control/validation/term.schema'
import { DomainError } from '@/domain/shared/domain-error'
import { isEnrollmentOpen, validateCanOpenTerm, validateTermDates } from '@/domain/terms/term-rules'

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

describe('validateCanOpenTerm', () => {
  const today = utc('2026-11-05')
  const term = { id: 'a', endsAt: utc('2027-04-05') }

  it('opens a term when no other term is open', () => {
    assert.doesNotThrow(() => validateCanOpenTerm(term, null, today))
  })

  it('blocks opening a second term and names the open one', () => {
    assert.throws(() => validateCanOpenTerm(term, { id: 'b', name: '2627-2' }, today), (error: Error) => {
      assert.ok(error instanceof DomainError)
      assert.match(error.message, /2627-2/)
      return true
    })
  })

  it('treats reopening the already open term as a no-op', () => {
    assert.doesNotThrow(() => validateCanOpenTerm(term, { id: 'a', name: '2627-2' }, today))
  })

  it('blocks opening a finished term', () => {
    assert.throws(() => validateCanOpenTerm({ id: 'a', endsAt: utc('2026-01-01') }, null, today), DomainError)
  })
})

describe('isEnrollmentOpen', () => {
  it('is true only with an open term', () => {
    assert.equal(isEnrollmentOpen({ open: true }), true)
    assert.equal(isEnrollmentOpen({ open: false }), false)
    assert.equal(isEnrollmentOpen(null), false)
  })
})
