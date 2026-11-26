// Account balance: what a student owes for each enrolled term, and the financial hold that blocks a new enrollment
// while an earlier term is not fully paid. Payments can be partial; only approved ones count.
import { DomainError } from '@/domain/shared/domain-error'

const toCents = (value: number) => Math.round(value * 100)

export interface BalancePayment {
  amount: number
  status: 'APPROVED' | 'REJECTED'
}

export function summarizeBalance(amount: number, payments: BalancePayment[]) {
  const paidCents = payments.filter((payment) => payment.status === 'APPROVED').reduce((sum, payment) => sum + toCents(payment.amount), 0)
  const balanceCents = Math.max(0, toCents(amount) - paidCents)
  return { amount, paid: paidCents / 100, balance: balanceCents / 100, settled: balanceCents === 0 }
}

export interface TermAccount {
  termName: string
  termStartsAt: Date
  enrolled: boolean
  amount: number
  payments: BalancePayment[]
}

// Earlier enrolled terms (started before `termStartsAt`) with money still owed, oldest first.
export function findFinancialHold(accounts: TermAccount[], termStartsAt: Date) {
  return accounts
    .filter((account) => account.enrolled && account.termStartsAt < termStartsAt)
    .map((account) => ({ termName: account.termName, termStartsAt: account.termStartsAt, ...summarizeBalance(account.amount, account.payments) }))
    .filter((account) => !account.settled)
    .sort((a, b) => a.termStartsAt.getTime() - b.termStartsAt.getTime())
}

export function financialHoldMessage(debts: { termName: string; balance: number }[]) {
  const detail = debts.map((debt) => `${debt.termName} (US$ ${debt.balance.toFixed(2)})`).join(', ')
  return `Tienes un bloqueo financiero: debes el período ${detail}. Completa el pago en Pagos para poder inscribir.`
}

export function assertNoFinancialHold(debts: { termName: string; balance: number }[]) {
  if (debts.length) throw new DomainError(financialHoldMessage(debts))
}

// A payment must be positive and cannot exceed what is still owed.
export function validatePaymentAmount(amount: number, balance: number) {
  if (!Number.isFinite(amount) || toCents(amount) <= 0) throw new DomainError('El monto a pagar debe ser mayor que cero.')
  if (toCents(amount) > toCents(balance)) {
    throw new DomainError(`El monto supera tu saldo pendiente de US$ ${balance.toFixed(2)}.`)
  }
}
