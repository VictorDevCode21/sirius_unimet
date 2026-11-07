import 'server-only'
import type { Prisma } from '@/data-access/generated/prisma/client'
import { inTransaction, loadAlternativeSections, loadSelectedSeats, type DbClient } from '@/data-access/repositories/seat.repository'
import { assertSeatsAvailable, evaluateSeats, type FullSection } from '@/domain/enrollment/seat-rules'

// Full sections of an enrollment with a suggested alternative each. With `lock`, the sections stay locked until the
// transaction of `client` ends.
export async function checkEnrollmentSeats(client: DbClient, enrollmentId: string, options: { lock: boolean }): Promise<FullSection[]> {
  const { termId, seats } = await loadSelectedSeats(client, enrollmentId, options)
  const fullSubjects = seats.filter((seat) => seat.taken >= seat.capacity)
  if (!fullSubjects.length) return []
  const alternatives = await loadAlternativeSections(
    client,
    termId,
    fullSubjects.map((seat) => seat.subjectId),
    seats.map((seat) => seat.sectionId),
  )
  return evaluateSeats(seats, alternatives)
}

/**
 * Takes the seats of every section in an enrollment. Locks each section (SELECT … FOR UPDATE) and throws a
 * DomainError naming any full section and suggesting another section of the same subject with seats left.
 *
 * Seats are held by confirmed enrollments, so call it inside the payment transaction (`tx`) right before setting the
 * enrollment to CONFIRMED: the locks last until that transaction commits and a concurrent confirmation of the same
 * last seat waits and then fails. It does not change the enrollment status. Without `tx` it runs its own transaction
 * and only validates.
 */
export async function confirmEnrollmentSeats(enrollmentId: string, tx?: Prisma.TransactionClient): Promise<void> {
  const take = async (client: DbClient) => assertSeatsAvailable(await checkEnrollmentSeats(client, enrollmentId, { lock: true }))
  if (tx) return take(tx)
  await inTransaction(take)
}
