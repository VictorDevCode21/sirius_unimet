import 'server-only'
import { auth } from '@/control/auth/auth'
import { getStudentContext } from '@/control/controllers/student-context'
import { findEnrollment } from '@/data-access/repositories/enrollment.repository'
import { findConfirmedEnrollments } from '@/data-access/repositories/receipt.repository'
import { findOpenTerm } from '@/data-access/repositories/term.repository'
import { findStudentProfile } from '@/data-access/repositories/user.repository'
import { isAwaitingEnrollment } from '@/domain/enrollment/enrollment-validator'

const toMinutes = (time: Date) => time.getUTCHours() * 60 + time.getUTCMinutes()

type ConfirmedEnrollment = Awaited<ReturnType<typeof findConfirmedEnrollments>>[number]

function toReceiptView(enrollment: ConfirmedEnrollment, student: { name: string; email: string; career: string }) {
  const sections = enrollment.details.map(({ section }) => ({
    id: section.id,
    number: section.number,
    professor: section.professor.name,
    blocks: section.scheduleBlocks.map((block) => ({ weekday: block.weekday, startMinutes: toMinutes(block.startTime), endMinutes: toMinutes(block.endTime) })),
    subject: { code: section.subject.code, name: section.subject.name, credits: section.subject.credits },
  }))
  return {
    term: enrollment.term.name,
    student,
    sections,
    totalCredits: sections.reduce((sum, section) => sum + section.subject.credits, 0),
    enrolledAt: enrollment.enrolledAt ?? enrollment.updatedAt,
  }
}

export type ReceiptView = ReturnType<typeof toReceiptView>

async function receiptsFor(studentId: string) {
  const profile = await findStudentProfile(studentId)
  const student = { name: profile.name, email: profile.email, career: profile.career?.name ?? '—' }
  return (await findConfirmedEnrollments(studentId)).map((enrollment) => toReceiptView(enrollment, student))
}

// Term name of the open term when the student pre-enrolled but has not enrolled yet, so the page asks them to enroll.
async function pendingEnrollmentTerm(studentId: string) {
  const openTerm = await findOpenTerm()
  if (!openTerm) return null
  const enrollment = await findEnrollment(studentId, openTerm.id)
  const awaiting = isAwaitingEnrollment(enrollment && { status: enrollment.status, sectionCount: enrollment.details.length })
  return awaiting ? openTerm.name : null
}

// Enrollment certificates of the signed-in student: the requested term, or the newest enrollment. `pendingEnrollment`
// names the open term when the student still has to enroll its pre-enrollment.
export async function getStudentReceipts(requestedTerm?: string) {
  const { profile } = await getStudentContext()
  const [receipts, pendingEnrollment] = await Promise.all([receiptsFor(profile.id), pendingEnrollmentTerm(profile.id)])
  const selected = receipts.find((receipt) => receipt.term === requestedTerm) ?? receipts[0] ?? null
  return { terms: receipts.map((receipt) => receipt.term), selected, pendingEnrollment }
}

// Receipt used by the PDF download. Only the owner of the enrollment can get it: the student id comes from the
// session, never from the request.
export async function getReceiptForDownload(termName: string) {
  const session = await auth()
  if (!session?.user?.id) return { status: 401 as const }
  if (session.user.role !== 'STUDENT') return { status: 403 as const }
  const receipt = (await receiptsFor(session.user.id)).find((item) => item.term === termName)
  return receipt ? { status: 200 as const, receipt } : { status: 404 as const }
}
