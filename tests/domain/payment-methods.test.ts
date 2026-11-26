import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { checkPaymentDetails, isCardExpired, isValidCardNumber, PAYMENT_METHODS, toBolivares } from '@/domain/billing/payment-methods'

const today = new Date(Date.UTC(2026, 10, 26, 15))

describe('payment methods', () => {
  it('offers the seven methods, four of them in bolívares', () => {
    assert.deepEqual(
      PAYMENT_METHODS.map((method) => method.id),
      ['PAGO_MOVIL', 'BANK_TRANSFER_VES', 'IMMEDIATE_DEBIT', 'ONLINE_CARD', 'ZELLE', 'BINANCE_PAY', 'US_BANK_TRANSFER'],
    )
    assert.equal(PAYMENT_METHODS.filter((method) => method.currency === 'VES').length, 4)
  })

  it('converts dollars to bolívares at the BCV rate, rounded to cents', () => {
    assert.equal(toBolivares(135, 924.3534), 124787.71)
    assert.equal(toBolivares(0.01, 924.3534), 9.24)
  })

  it('checks a Pago Móvil and masks the phone', () => {
    const ok = checkPaymentDetails('PAGO_MOVIL', { bank: '0134', phone: '0414-1234567', idNumber: 'v-12.345.678', reference: '000123456', date: '2026-11-26' }, today)
    assert.deepEqual(ok.errors, [])
    assert.equal(ok.payerReference, '000123456')
    assert.deepEqual(ok.details, { bank: '0134 · Banesco', phone: '0414-***4567', idNumber: 'V-12345678', date: '2026-11-26' })

    const bad = checkPaymentDetails('PAGO_MOVIL', { bank: '9999', phone: '0212-1234567', idNumber: '123', reference: '12', date: '2026-12-31' }, today)
    assert.equal(bad.errors.length, 5)
  })

  it('asks Zelle for the holder, the Zelle contact and the confirmation number', () => {
    const ok = checkPaymentDetails('ZELLE', { holderName: 'Ana Pérez', zelleContact: 'ana@example.com', reference: '9ab12cd34', date: '2026-11-25' }, today)
    assert.deepEqual(ok.errors, [])
    assert.equal(ok.payerReference, '9AB12CD34')
    const bad = checkPaymentDetails('ZELLE', { holderName: '', zelleContact: 'no-es-correo', reference: '###', date: '2026-01-01' }, today)
    assert.deepEqual(bad.errors, [
      'Escribe el titular de la cuenta Zelle.',
      'El contacto Zelle debe ser un correo o un teléfono de EE. UU.',
      'El número de confirmación de Zelle debe tener entre 6 y 20 letras o dígitos.',
      'La fecha del pago no puede tener más de 30 días.',
    ])
  })

  it('asks Binance Pay for the payer and the order id, and US transfers for the confirmation number', () => {
    assert.deepEqual(checkPaymentDetails('BINANCE_PAY', { payerId: '123456789', reference: '305123456789012345', date: '2026-11-26' }, today).errors, [])
    assert.equal(checkPaymentDetails('BINANCE_PAY', { payerId: 'x', reference: '123', date: '2026-11-26' }, today).errors.length, 2)
    const us = checkPaymentDetails(
      'US_BANK_TRANSFER',
      { bankName: 'Chase', holderName: 'Ana Pérez', accountLast4: '1234', transferType: 'ACH', reference: '021000020123456', date: '2026-11-20' },
      today,
    )
    assert.deepEqual(us.errors, [])
    assert.equal(us.details.account, '•••• 1234')
  })

  it('validates cards with Luhn and expiry, and stores only the brand and last four digits', () => {
    assert.equal(isValidCardNumber('4111 1111 1111 1111'), true)
    assert.equal(isValidCardNumber('4111 1111 1111 1112'), false)
    assert.equal(isCardExpired('11/26', today), false)
    assert.equal(isCardExpired('10/26', today), true)
    const card = checkPaymentDetails('ONLINE_CARD', { cardNumber: '4111111111111111', cardHolder: 'ANA PEREZ', expiry: '12/28', cvv: '987', idNumber: 'V12345678' }, today)
    assert.deepEqual(card.errors, [])
    assert.equal(card.details.card, 'Visa •••• 1111')
    assert.equal(JSON.stringify(card.details).includes('4111111111111111'), false)
    assert.equal(JSON.stringify(card.details).includes('987'), false)
    assert.equal(card.payerReference, null)
  })

  it('asks the immediate debit for bank, phone, ID and the 8-digit SMS key', () => {
    assert.deepEqual(checkPaymentDetails('IMMEDIATE_DEBIT', { bank: '0105', phone: '04241234567', idNumber: 'E-81234567', otp: '12345678' }, today).errors, [])
    assert.deepEqual(checkPaymentDetails('IMMEDIATE_DEBIT', { bank: '0105', phone: '04241234567', idNumber: 'E-81234567', otp: '123' }, today).errors, [
      'La clave de débito debe tener 8 dígitos.',
    ])
  })
})
