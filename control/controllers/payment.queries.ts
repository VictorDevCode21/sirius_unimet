import 'server-only'
import { getStudentContext } from '@/control/controllers/student-context'
import { getBcvUsdRate } from '@/data-access/external/bcv-rate'
import { findStudentAccounts } from '@/data-access/repositories/payment.repository'
import { summarizeBalance } from '@/domain/billing/account-balance'
import { PAYMENT_METHODS } from '@/domain/billing/payment-methods'

// Account statement of the signed-in student: every enrolled term with its amount, approved payments and balance,
// the payment history, the BCV rate for bolívar methods and the accepted payment methods.
export async function getPaymentsOverview() {
  const { profile } = await getStudentContext()
  const [accounts, bcv] = await Promise.all([findStudentAccounts(profile.id), getBcvUsdRate()])

  const terms = accounts
    .filter((account) => account.status === 'CONFIRMED')
    .map((account) => {
      const payments = account.payments.map((payment) => ({
        id: payment.id,
        reference: payment.reference,
        payerReference: payment.payerReference,
        method: payment.method,
        currency: payment.currency,
        amount: Number(payment.amount),
        paidAmount: payment.paidAmount === null ? null : Number(payment.paidAmount),
        exchangeRate: payment.exchangeRate === null ? null : Number(payment.exchangeRate),
        status: payment.status,
        details: (payment.details ?? {}) as Record<string, string>,
        createdAt: payment.createdAt,
      }))
      return {
        termId: account.term.id,
        termName: account.term.name,
        termStartsAt: account.term.startsAt,
        enrolledAt: account.enrolledAt,
        subjects: account._count.details,
        ...summarizeBalance(Number(account.amount), payments),
        payments,
      }
    })
    .reverse()

  return {
    terms,
    totalDue: Math.round(terms.reduce((sum, term) => sum + term.balance * 100, 0)) / 100,
    bcv: bcv ? { rate: bcv.rate, valueDate: bcv.valueDate, stale: bcv.stale } : null,
    methods: PAYMENT_METHODS,
  }
}

export type PaymentsOverview = Awaited<ReturnType<typeof getPaymentsOverview>>
export type TermStatement = PaymentsOverview['terms'][number]
