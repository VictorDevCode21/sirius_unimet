// Repricing rules: a fee change reaches unpaid enrollments, while a paid enrollment keeps the amount it was paid with.
import { calculateAmount } from '@/domain/billing/amount-calculator'

export interface PricedEnrollment {
  status: 'PRE_ENROLLED' | 'PENDING' | 'CONFIRMED'
  amount: number
  credits: number
}

export function repriceEnrollment(enrollment: PricedEnrollment, ratePerCredit: number) {
  return enrollment.status === 'CONFIRMED' ? enrollment.amount : calculateAmount(enrollment.credits, ratePerCredit)
}
