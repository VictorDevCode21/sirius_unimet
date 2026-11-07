import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { describeEnrollmentAvailability } from '@/domain/terms/term-rules'

const utc = (value: string) => new Date(`${value}T00:00:00.000Z`)
const window = { startsAt: utc('2027-01-08'), endsAt: utc('2027-04-05') }

describe('describeEnrollmentAvailability', () => {
  it('offers pre-enrollment for the open term', () => {
    const availability = describeEnrollmentAvailability({ open: true, name: '2627-2', ...window }, { name: '2627-3', ...window })
    assert.deepEqual(availability, { isOpen: true, termName: '2627-2', nextTerm: null })
  })

  it('does not offer pre-enrollment and returns the next term dates when no term is open', () => {
    const availability = describeEnrollmentAvailability(null, { name: '2627-3', ...window })
    assert.deepEqual(availability, { isOpen: false, termName: null, nextTerm: { name: '2627-3', ...window } })
  })

  it('treats a term whose open flag is false as closed', () => {
    const availability = describeEnrollmentAvailability({ open: false, name: '2627-2', ...window }, null)
    assert.equal(availability.isOpen, false)
    assert.equal(availability.nextTerm, null)
  })
})
