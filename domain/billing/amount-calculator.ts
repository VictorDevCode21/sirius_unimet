// Amount calculator: amount = total credits × rate per credit of the term, rounded to cents.
export function calculateAmount(totalCredits: number, ratePerCredit: number) {
  return Math.round(totalCredits * ratePerCredit * 100) / 100
}
