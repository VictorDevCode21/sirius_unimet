// Amount calculator: amount = total credits × rate per credit of the term, rounded to cents.
export function calculateAmount(totalCredits: number, ratePerCredit: number) {
  return Math.round(totalCredits * ratePerCredit * 100) / 100
}

// Total credits of a selection and the amount the student pays for it at the term's rate per credit.
export function summarizeAmount(sections: { credits: number }[], ratePerCredit: number) {
  const totalCredits = sections.reduce((sum, section) => sum + section.credits, 0)
  return { totalCredits, amount: calculateAmount(totalCredits, ratePerCredit) }
}
