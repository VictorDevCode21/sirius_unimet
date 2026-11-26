import type { Prisma } from '@/data-access/generated/prisma/client'
import type { EnrollmentStatus, PaymentCurrency, PaymentMethod } from '@/data-access/generated/prisma/enums'
import { prisma } from '@/data-access/prisma'
import { isUniqueViolation } from '@/data-access/unique-violation'

export interface PaymentRecord {
  enrollmentId: string
  reference: string
  method: PaymentMethod
  currency: PaymentCurrency
  // Amount credited to the enrollment, in USD.
  amount: number
  paidAmount: number
  exchangeRate: number | null
  payerReference: string | null
  details: Record<string, string>
}

export type RecordPaymentResult =
  | { ok: true; payment: Awaited<ReturnType<typeof prisma.simulatedPayment.create>> }
  | { ok: false; reason: 'not-found' | 'duplicate-reference' }

// Records an approved payment (or partial payment) of an enrollment while holding a row lock on it, so concurrent
// payments are applied one at a time and never exceed the balance. `assertPayable` receives the enrollment status
// and what is still owed at that moment, and throws to cancel. A payer reference already used with the same method
// is refused.
export async function recordPayment(
  record: PaymentRecord,
  assertPayable: (state: { status: EnrollmentStatus; amount: number; approvedPayments: number[] }) => void,
): Promise<RecordPaymentResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      const [locked] = await tx.$queryRaw<{ status: EnrollmentStatus; amount: Prisma.Decimal }[]>`
        SELECT "status", "amount" FROM "Enrollment" WHERE "id" = ${record.enrollmentId}::uuid FOR UPDATE`
      if (!locked) return { ok: false as const, reason: 'not-found' as const }
      const approved = await tx.simulatedPayment.findMany({ where: { enrollmentId: record.enrollmentId, status: 'APPROVED' }, select: { amount: true } })
      assertPayable({ status: locked.status, amount: Number(locked.amount), approvedPayments: approved.map((payment) => Number(payment.amount)) })

      const payment = await tx.simulatedPayment.create({
        data: {
          enrollmentId: record.enrollmentId,
          reference: record.reference,
          amount: record.amount,
          status: 'APPROVED',
          method: record.method,
          currency: record.currency,
          paidAmount: record.paidAmount,
          exchangeRate: record.exchangeRate,
          payerReference: record.payerReference,
          details: record.details,
        },
      })
      return { ok: true as const, payment }
    })
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, reason: 'duplicate-reference' }
    throw error
  }
}

// Every enrollment of a student with its term and payments, oldest term first: the student's account statement.
export function findStudentAccounts(studentId: string) {
  return prisma.enrollment.findMany({
    where: { studentId },
    include: {
      term: { select: { id: true, name: true, startsAt: true, endsAt: true, open: true } },
      payments: { orderBy: { createdAt: 'desc' } },
      _count: { select: { details: true } },
    },
    orderBy: { term: { startsAt: 'asc' } },
  })
}
