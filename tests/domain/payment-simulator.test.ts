import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { simulatePaymentSchema } from '@/control/validation/payment.schema'
import { paymentReference, statusAfterPayment, validatePayable } from '@/domain/billing/payment-simulator'
import { DomainError } from '@/domain/shared/domain-error'

describe('HU-18A payment simulator rules', () => {
  it('accepts a pre-enrollment with sections and amount', () => {
    assert.doesNotThrow(() => validatePayable({ status: 'PRE_ENROLLED', sections: 2, amount: 270 }))
  })

  it('rejects missing, confirmed, empty and zero-amount enrollments', () => {
    assert.throws(() => validatePayable(null), /pre-inscripción/)
    assert.throws(() => validatePayable({ status: 'CONFIRMED', sections: 2, amount: 270 }), /ya está pagada/)
    assert.throws(() => validatePayable({ status: 'PRE_ENROLLED', sections: 0, amount: 0 }), /no tiene secciones/)
    assert.throws(() => validatePayable({ status: 'PRE_ENROLLED', sections: 1, amount: 0 }), DomainError)
  })

  it('confirms the enrollment when the payment is approved', () => {
    assert.equal(statusAfterPayment('APPROVED'), 'CONFIRMED')
  })

  it('derives one stable reference per attempt', () => {
    const attempt = '3f2504e0-4f89-41d3-9a0c-0305e82c3301'
    assert.equal(paymentReference('2627-2', attempt), 'SIM-2627-2-3F2504E04F89')
    assert.equal(paymentReference('2627-2', attempt), paymentReference('2627-2', attempt))
  })

  it('validates the action input', () => {
    assert.equal(simulatePaymentSchema.safeParse({ outcome: 'APPROVED', attemptId: crypto.randomUUID() }).success, true)
    assert.equal(simulatePaymentSchema.safeParse({ outcome: 'FREE', attemptId: crypto.randomUUID() }).success, false)
    assert.equal(simulatePaymentSchema.safeParse({ outcome: 'APPROVED', attemptId: '1' }).success, false)
  })
})
