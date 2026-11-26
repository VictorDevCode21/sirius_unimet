import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isOfferable, isSectionFull, seatsLeft } from '@/domain/enrollment/offer-rules'

describe('offer rules', () => {
  it('lists sections only for available subjects', () => {
    assert.equal(isOfferable('AVAILABLE'), true)
    assert.equal(isOfferable('BLOCKED'), false)
    assert.equal(isOfferable('PASSED'), false)
    assert.equal(isOfferable('IN_PROGRESS'), false)
  })

  it('counts the seats left without going below zero', () => {
    assert.equal(seatsLeft(30, 12), 18)
    assert.equal(seatsLeft(30, 30), 0)
    assert.equal(seatsLeft(30, 31), 0)
  })

  it('marks a section as full when no seats are left', () => {
    assert.equal(isSectionFull(30, 29), false)
    assert.equal(isSectionFull(30, 30), true)
  })
})
