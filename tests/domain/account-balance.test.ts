import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { assertNoFinancialHold, findFinancialHold, summarizeBalance, validatePaymentAmount } from '@/domain/billing/account-balance'
import { DomainError } from '@/domain/shared/domain-error'

const earlier = new Date(Date.UTC(2026, 8, 15))
const current = new Date(Date.UTC(2027, 0, 8))

describe('account balance', () => {
  it('adds only approved partial payments and never goes below zero', () => {
    const balance = summarizeBalance(405, [
      { amount: 100.1, status: 'APPROVED' },
      { amount: 50, status: 'REJECTED' },
      { amount: 200.2, status: 'APPROVED' },
    ])
    assert.deepEqual(balance, { amount: 405, paid: 300.3, balance: 104.7, settled: false })
    assert.equal(summarizeBalance(100, [{ amount: 100, status: 'APPROVED' }]).settled, true)
  })

  it('blocks enrolling while an earlier enrolled term is not fully paid', () => {
    const debts = findFinancialHold(
      [
        { termName: '2627-1', termStartsAt: earlier, enrolled: true, amount: 405, payments: [{ amount: 200, status: 'APPROVED' }] },
        { termName: '2526-3', termStartsAt: new Date(Date.UTC(2026, 3, 20)), enrolled: true, amount: 300, payments: [{ amount: 300, status: 'APPROVED' }] },
        { termName: '2627-2', termStartsAt: current, enrolled: true, amount: 300, payments: [] },
        { termName: '2526-2', termStartsAt: new Date(Date.UTC(2026, 0, 8)), enrolled: false, amount: 135, payments: [] },
      ],
      current,
    )
    assert.deepEqual(
      debts.map((debt) => [debt.termName, debt.balance]),
      [['2627-1', 205]],
    )
    assert.throws(() => assertNoFinancialHold(debts), /bloqueo financiero: debes el período 2627-1 \(US\$ 205.00\)/)
    assert.doesNotThrow(() => assertNoFinancialHold([]))
  })

  it('accepts partial payments up to the balance', () => {
    assert.doesNotThrow(() => validatePaymentAmount(50, 104.7))
    assert.doesNotThrow(() => validatePaymentAmount(104.7, 104.7))
    assert.throws(() => validatePaymentAmount(104.71, 104.7), DomainError)
    assert.throws(() => validatePaymentAmount(0, 104.7), /mayor que cero/)
  })
})
