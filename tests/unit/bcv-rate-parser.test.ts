import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { parseBcvUsdRate } from '@/data-access/external/bcv-rate-parser'

describe('BCV rate parser', () => {
  it('reads the USD rate and its value date from the BCV home page', () => {
    const html = readFileSync(path.join(process.cwd(), 'tests/fixtures/bcv-home-fragment.html'), 'utf8')
    assert.deepEqual(parseBcvUsdRate(html), { rate: 924.3534, valueDate: '2026-11-26' })
  })

  it('handles thousands separators and a missing rate', () => {
    assert.equal(parseBcvUsdRate('<div id="dolar"><strong class="strong-tb"> 1.024,50000000 </strong></div>')?.rate, 1024.5)
    assert.equal(parseBcvUsdRate('<html>sin tasa</html>'), null)
  })
})
