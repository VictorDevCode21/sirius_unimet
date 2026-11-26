import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { computeOccupancy, isNearlyFull, summarizeOccupancy } from '@/domain/sections/occupancy'

describe('HU-12 occupancy', () => {
  it('takes seats only with confirmed enrollments and lists unpaid students apart', () => {
    const occupancy = computeOccupancy(30, ['CONFIRMED', 'PRE_ENROLLED', 'PENDING', 'CONFIRMED'])
    assert.deepEqual(
      { enrolled: occupancy.enrolled, unpaid: occupancy.unpaid, available: occupancy.available, full: occupancy.full },
      { enrolled: 2, unpaid: 2, available: 28, full: false },
    )
    assert.equal(occupancy.percent, 7)
  })

  it('handles an empty and a full section', () => {
    assert.deepEqual(computeOccupancy(25, []), { capacity: 25, enrolled: 0, unpaid: 0, available: 25, full: false, nearlyFull: false, percent: 0 })
    const full = computeOccupancy(2, ['CONFIRMED', 'CONFIRMED', 'PENDING'])
    assert.equal(full.full, true)
    assert.equal(full.available, 0)
    assert.equal(full.percent, 100)
  })

  it('does not fill a section with unpaid students', () => {
    const occupancy = computeOccupancy(2, ['PENDING', 'PRE_ENROLLED'])
    assert.deepEqual([occupancy.enrolled, occupancy.available, occupancy.full], [0, 2, false])
  })

  it('never reports negative availability', () => {
    assert.equal(computeOccupancy(1, ['CONFIRMED', 'CONFIRMED']).available, 0)
  })

  it('flags a section from 90% of its capacity using the exact ratio', () => {
    assert.equal(isNearlyFull(27, 30), true)
    assert.equal(isNearlyFull(26, 30), false)
    // 90% of 25 is 22.5: 22 students (88%, shown as 88) is not nearly full, 23 is.
    assert.equal(isNearlyFull(22, 25), false)
    assert.equal(isNearlyFull(23, 25), true)
    // 90% of 7 is 6.3: 6 students (86%, rounded to 86) is not nearly full, 7 is.
    assert.equal(isNearlyFull(6, 7), false)
    assert.equal(computeOccupancy(10, Array(9).fill('CONFIRMED')).nearlyFull, true)
  })

  it('adds up the totals of a term', () => {
    const totals = summarizeOccupancy([
      computeOccupancy(30, ['CONFIRMED']),
      computeOccupancy(2, ['CONFIRMED', 'CONFIRMED']),
      computeOccupancy(10, Array(9).fill('CONFIRMED')),
    ])
    assert.deepEqual(totals, { sections: 3, capacity: 42, enrolled: 12, available: 30, full: 1, nearlyFull: 1 })
  })
})
