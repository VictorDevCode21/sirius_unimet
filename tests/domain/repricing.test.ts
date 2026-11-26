import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ratePerCreditSchema } from '@/control/validation/term.schema'
import { repriceEnrollment } from '@/domain/billing/repricing'

describe('repriceEnrollment', () => {
  it('reprices unpaid enrollments with the new fee', () => {
    assert.equal(repriceEnrollment({ status: 'PRE_ENROLLED', amount: 450, credits: 10 }, 50), 500)
    assert.equal(repriceEnrollment({ status: 'PENDING', amount: 450, credits: 10 }, 50), 500)
  })

  it('keeps the amount of a paid enrollment', () => {
    assert.equal(repriceEnrollment({ status: 'CONFIRMED', amount: 450, credits: 10 }, 50), 450)
  })
})

describe('ratePerCreditSchema', () => {
  const termId = '00000000-0000-4000-8000-000000000000'

  it('accepts a positive amount with up to two decimals', () => {
    assert.equal(ratePerCreditSchema.parse({ termId, ratePerCredit: '45.50' }).ratePerCredit, 45.5)
  })

  it('rejects negative, zero, empty and non-numeric values', () => {
    for (const ratePerCredit of ['-1', '0', '0.00', '', '   ', 'abc', '1e3', '12.345']) {
      assert.equal(ratePerCreditSchema.safeParse({ termId, ratePerCredit }).success, false, ratePerCredit)
    }
  })
})
