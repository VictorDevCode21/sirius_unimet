import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { computeOccupancy, summarizeOccupancy } from '@/domain/sections/occupancy'

describe('HU-12 occupancy', () => {
  it('counts every seat holder and separates confirmed ones', () => {
    const occupancy = computeOccupancy(30, ['CONFIRMED', 'PRE_ENROLLED', 'PENDING', 'CONFIRMED'])
    assert.deepEqual(
      { enrolled: occupancy.enrolled, confirmed: occupancy.confirmed, unpaid: occupancy.unpaid, available: occupancy.available, full: occupancy.full },
      { enrolled: 4, confirmed: 2, unpaid: 2, available: 26, full: false },
    )
    assert.equal(occupancy.percent, 13)
  })

  it('handles an empty and a full section', () => {
    assert.deepEqual(computeOccupancy(25, []), { capacity: 25, enrolled: 0, confirmed: 0, unpaid: 0, available: 25, full: false, percent: 0 })
    const full = computeOccupancy(2, ['PENDING', 'CONFIRMED'])
    assert.equal(full.full, true)
    assert.equal(full.available, 0)
    assert.equal(full.percent, 100)
  })

  it('never reports negative availability', () => {
    assert.equal(computeOccupancy(1, ['CONFIRMED', 'CONFIRMED']).available, 0)
  })

  it('adds up the totals of a term', () => {
    const totals = summarizeOccupancy([computeOccupancy(30, ['CONFIRMED']), computeOccupancy(2, ['PENDING', 'PRE_ENROLLED'])])
    assert.deepEqual(totals, { sections: 2, capacity: 32, enrolled: 3, available: 29, full: 1 })
  })
})
