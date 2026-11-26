import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { centsFromText, centsToDecimal, formatCents, toCents } from '@/presentation/lib/money-entry'

describe('bank-style money entry', () => {
  it('fills the amount from the right with two fixed decimals', () => {
    let shown = formatCents(0)
    const steps = ['5', '0', '0', '0', '0'].map((digit) => (shown = formatCents(centsFromText(shown + digit))))
    assert.deepEqual(steps, ['0,05', '0,50', '5,00', '50,00', '500,00'])
  })

  it('removes the last digit on backspace', () => {
    assert.equal(formatCents(centsFromText('1.234,5')), '123,45')
    assert.equal(formatCents(centsFromText('0,0')), '0,00')
  })

  it('groups thousands, ignores pasted separators and caps the digits', () => {
    assert.equal(formatCents(1234567), '12.345,67')
    assert.equal(centsFromText('$ 1.250,00'), 125000)
    assert.equal(centsFromText('123456789012'), 1234567890)
  })

  it('converts to the dot decimal the server expects', () => {
    assert.equal(centsToDecimal(13550), '135.50')
    assert.equal(centsToDecimal(5), '0.05')
    assert.equal(toCents(337.5), 33750)
    assert.equal(toCents(0.1 + 0.2), 30)
  })
})
