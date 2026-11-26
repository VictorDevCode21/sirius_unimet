// Bank-style money entry: every typed digit enters on the right and the amount always shows two fixed decimals,
// so typing "5", "0" shows 0,05 and then 0,50. The amount is kept in cents.

export const MAX_MONEY_DIGITS = 10

// Cents of the digits in a typed text, ignoring separators and anything that is not a digit.
export function centsFromText(text: string) {
  const digits = text.replace(/\D/g, '').replace(/^0+/, '').slice(0, MAX_MONEY_DIGITS)
  return digits ? Number(digits) : 0
}

// Amount in Venezuelan notation with two decimals: 1234567 → "12.345,67".
export function formatCents(cents: number) {
  const whole = Math.floor(cents / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${whole},${String(cents % 100).padStart(2, '0')}`
}

// Amount with a dot decimal separator, as the server schemas expect: 13550 → "135.50".
export function centsToDecimal(cents: number) {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`
}

export function toCents(amount: number) {
  return Math.round(amount * 100)
}
