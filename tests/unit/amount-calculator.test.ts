import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { calculateAmount, summarizeAmount } from '@/domain/billing/amount-calculator'

describe('amount calculator', () => {
  it('charges total credits times the rate per credit (16 UC × 10 = 160)', () => {
    assert.equal(calculateAmount(16, 10), 160)
  })

  it('rounds the amount to cents', () => {
    assert.equal(calculateAmount(3, 33.335), 100.01)
  })

  it('summarizes the credits and the amount of a selection', () => {
    const sections = [{ credits: 4 }, { credits: 4 }, { credits: 3 }, { credits: 3 }, { credits: 2 }]
    assert.deepEqual(summarizeAmount(sections, 10), { totalCredits: 16, amount: 160 })
  })

  it('recalculates when a section is added or removed', () => {
    const sections = [{ credits: 4 }, { credits: 4 }, { credits: 3 }]
    assert.equal(summarizeAmount(sections, 10).amount, 110)
    assert.equal(summarizeAmount([...sections, { credits: 3 }], 10).amount, 140)
    assert.equal(summarizeAmount(sections.slice(1), 10).amount, 70)
  })

  it('charges nothing for an empty selection', () => {
    assert.deepEqual(summarizeAmount([], 45), { totalCredits: 0, amount: 0 })
  })
})
