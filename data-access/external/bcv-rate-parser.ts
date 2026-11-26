export interface BcvRate {
  // Bolívares per US dollar.
  rate: number
  // "Fecha Valor" published next to the rate (YYYY-MM-DD), or null when the page does not show it.
  valueDate: string | null
}

// Reads the USD rate from the BCV home page: the number inside the `#dolar` block, written with a decimal comma
// (e.g. "924,35340000"), and the date of its "Fecha Valor" label.
export function parseBcvUsdRate(html: string): BcvRate | null {
  const block = /id="dolar"[\s\S]*?<strong[^>]*>\s*([\d.,]+)\s*<\/strong>/.exec(html)
  if (!block) return null
  const rate = Number(block[1].replace(/\./g, '').replace(',', '.'))
  if (!Number.isFinite(rate) || rate <= 0) return null
  const date = /Fecha Valor:[\s\S]*?content="(\d{4}-\d{2}-\d{2})/.exec(html)
  return { rate, valueDate: date ? date[1] : null }
}
