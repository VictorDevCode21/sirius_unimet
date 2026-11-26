import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  assignTurns,
  computeIaa,
  computeLastTermAverage,
  enrollmentWindow,
  TURN_COUNT,
  turnStartsAt,
  turnState,
} from '@/domain/enrollment/enrollment-turn'

const term1 = new Date(Date.UTC(2026, 0, 8))
const term2 = new Date(Date.UTC(2026, 3, 20))
const day = new Date(Date.UTC(2026, 11, 3))

describe('academic index', () => {
  it('weights every grade by the credits of its subject', () => {
    assert.equal(computeIaa([{ value: 20, credits: 4, termStartsAt: term1 }, { value: 10, credits: 2, termStartsAt: term1 }]), 16.67)
    assert.equal(computeIaa([]), null)
  })

  it('averages only the grades of the most recent term', () => {
    const grades = [
      { value: 10, credits: 3, termStartsAt: term1 },
      { value: 18, credits: 3, termStartsAt: term2 },
      { value: 16, credits: 3, termStartsAt: term2 },
    ]
    assert.equal(computeLastTermAverage(grades), 17)
    assert.equal(computeLastTermAverage([]), null)
  })
})

describe('enrollment turns', () => {
  it('runs two days from 7:00 to 17:00 Caracas time (UTC−4)', () => {
    assert.equal(turnStartsAt(day, 0).toISOString(), '2026-12-03T11:00:00.000Z')
    assert.equal(turnStartsAt(day, 9).toISOString(), '2026-12-03T20:00:00.000Z')
    assert.equal(turnStartsAt(day, 10).toISOString(), '2026-12-04T11:00:00.000Z')
    assert.equal(turnStartsAt(day, TURN_COUNT - 1).toISOString(), '2026-12-04T20:00:00.000Z')
    const { opensAt, closesAt } = enrollmentWindow(day)
    assert.equal(opensAt.toISOString(), '2026-12-03T11:00:00.000Z')
    assert.equal(closesAt.toISOString(), '2026-12-04T21:00:00.000Z')
  })

  it('gives first trimester students the first hour and orders the rest by IAA, then by last term average', () => {
    const turns = assignTurns([
      { studentId: 'new', iaa: null, lastTermAverage: null },
      { studentId: 'low', iaa: 12, lastTermAverage: 12 },
      { studentId: 'top', iaa: 19, lastTermAverage: 18 },
      { studentId: 'tie-better', iaa: 15, lastTermAverage: 17 },
      { studentId: 'tie-worse', iaa: 15, lastTermAverage: 13 },
    ])
    assert.equal(turns.get('new'), 0)
    assert.equal(turns.get('top'), 0)
    assert.ok(turns.get('tie-better')! < turns.get('tie-worse')!)
    assert.ok(turns.get('tie-worse')! < turns.get('low')!)
    assert.ok(turns.get('low')! < TURN_COUNT)
  })

  it('spreads many students over every hourly turn of both days', () => {
    const candidates = Array.from({ length: 200 }, (_, index) => ({ studentId: `s${index}`, iaa: 20 - index / 20, lastTermAverage: 15 }))
    const used = new Set(assignTurns(candidates).values())
    assert.equal(used.size, TURN_COUNT)
  })

  it('lets the student enroll from the start of the turn until the window closes', () => {
    const turnAt = turnStartsAt(day, 3)
    const { closesAt } = enrollmentWindow(day)
    assert.equal(turnState(new Date(turnAt.getTime() - 1), turnAt, closesAt), 'UPCOMING')
    assert.equal(turnState(turnAt, turnAt, closesAt), 'ACTIVE')
    assert.equal(turnState(closesAt, turnAt, closesAt), 'CLOSED')
    assert.equal(turnState(turnAt, null, null), 'NOT_SCHEDULED')
  })
})
