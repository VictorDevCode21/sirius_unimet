import type { Prisma } from '@/data-access/generated/prisma/client'
import { prisma } from '@/data-access/prisma'
import type { EnrollmentStatus, PaymentStatus } from '@/data-access/generated/prisma/enums'

// Records a simulated payment while holding a row lock on the enrollment, so concurrent requests are applied one at
// a time. A repeated attempt (same reference) returns the payment it already created instead of charging again.
// The amount is computed inside the transaction, and an approved payment takes the seats (`takeSeats`, which locks
// the sections until the commit) before the enrollment is confirmed; if a section is full, nothing is recorded.
export function recordSimulatedPayment(params: {
  enrollmentId: string
  reference: string
  outcome: PaymentStatus
  computeAmount: (tx: Prisma.TransactionClient) => Promise<number>
  takeSeats: (tx: Prisma.TransactionClient) => Promise<void>
  assertPayable: (state: { status: EnrollmentStatus; sections: number; amount: number }) => void
  statusAfter: (outcome: PaymentStatus) => EnrollmentStatus
}) {
  return prisma.$transaction(async (tx) => {
    const [locked] = await tx.$queryRaw<{ status: EnrollmentStatus }[]>`
      SELECT "status" FROM "Enrollment" WHERE "id" = ${params.enrollmentId}::uuid FOR UPDATE`
    if (!locked) return null

    const replay = await tx.simulatedPayment.findUnique({ where: { reference: params.reference } })
    if (replay) {
      if (replay.enrollmentId !== params.enrollmentId) return null
      return { payment: replay, replayed: true }
    }

    const sections = await tx.enrollmentDetail.count({ where: { enrollmentId: params.enrollmentId } })
    const amount = await params.computeAmount(tx)
    params.assertPayable({ status: locked.status, sections, amount })
    if (params.outcome === 'APPROVED') await params.takeSeats(tx)

    const payment = await tx.simulatedPayment.create({
      data: { enrollmentId: params.enrollmentId, reference: params.reference, amount, status: params.outcome },
    })
    await tx.enrollment.update({ where: { id: params.enrollmentId }, data: { status: params.statusAfter(params.outcome), amount } })
    return { payment, replayed: false }
  })
}

export function listPayments(enrollmentId: string) {
  return prisma.simulatedPayment.findMany({ where: { enrollmentId }, orderBy: { createdAt: 'desc' } })
}
