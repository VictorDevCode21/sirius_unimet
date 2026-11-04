import { prisma } from '@/data-access/prisma'
import type { EnrollmentStatus, PaymentStatus } from '@/data-access/generated/prisma/enums'

// Records a simulated payment while holding a row lock on the enrollment, so concurrent requests are applied one at
// a time. A repeated attempt (same reference) returns the payment it already created instead of charging again.
export function recordSimulatedPayment(params: {
  enrollmentId: string
  reference: string
  outcome: PaymentStatus
  computeAmount: (totalCredits: number) => number
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

    const details = await tx.enrollmentDetail.findMany({
      where: { enrollmentId: params.enrollmentId },
      select: { section: { select: { subject: { select: { credits: true } } } } },
    })
    const amount = params.computeAmount(details.reduce((sum, detail) => sum + detail.section.subject.credits, 0))
    params.assertPayable({ status: locked.status, sections: details.length, amount })

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
