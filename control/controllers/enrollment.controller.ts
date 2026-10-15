'use server'

import { revalidatePath } from 'next/cache'
import { getStudentContext } from '@/control/controllers/student-context'
import { sectionIdSchema } from '@/control/validation/enrollment.schema'
import {
  addSectionWithSeatLock,
  findEnrollment,
  removeSection as removeEnrollmentSection,
} from '@/data-access/repositories/enrollment.repository'
import { findOfferByTerm, findSectionById } from '@/data-access/repositories/section.repository'
import { findOpenTerm } from '@/data-access/repositories/term.repository'
import { calculateAmount } from '@/domain/billing/amount-calculator'
import {
  validateCapacity,
  validateMaxCredits,
  validatePrerequisites,
  validateScheduleClash,
  validateSingleSectionPerSubject,
  validateTermOpen,
  type SectionCandidate,
} from '@/domain/enrollment/enrollment-validator'
import { DomainError } from '@/domain/shared/domain-error'

export interface ActionResult {
  ok: boolean
  message: string
}

type SectionRecord = NonNullable<Awaited<ReturnType<typeof findSectionById>>>

const toMinutes = (time: Date) => time.getUTCHours() * 60 + time.getUTCMinutes()

function toCandidate(section: SectionRecord): SectionCandidate {
  return {
    id: section.id,
    subjectId: section.subjectId,
    subjectName: section.subject.name,
    credits: section.subject.credits,
    blocks: section.scheduleBlocks.map((block) => ({
      weekday: block.weekday,
      startMinutes: toMinutes(block.startTime),
      endMinutes: toMinutes(block.endTime),
    })),
  }
}

function toSectionView(section: SectionRecord) {
  return {
    id: section.id,
    number: section.number,
    professor: section.professor.name,
    capacity: section.capacity,
    occupied: section._count.enrollmentDetails,
    blocks: section.scheduleBlocks.map((block) => ({
      weekday: block.weekday,
      startMinutes: toMinutes(block.startTime),
      endMinutes: toMinutes(block.endTime),
    })),
    subject: { id: section.subject.id, code: section.subject.code, name: section.subject.name, credits: section.subject.credits },
  }
}

export type SectionView = ReturnType<typeof toSectionView>

// Lists the open term offer for the student's career, grouped by subject, with the current selection.
export async function listOffer() {
  const { profile, subjects } = await getStudentContext()
  const term = await findOpenTerm()
  if (!term) return null

  const [sections, enrollment] = await Promise.all([findOfferByTerm(term.id, profile.career.id), findEnrollment(profile.id, term.id)])
  const sectionsBySubject = new Map<string, SectionView[]>()
  for (const section of sections) {
    sectionsBySubject.set(section.subjectId, [...(sectionsBySubject.get(section.subjectId) ?? []), toSectionView(section)])
  }

  return {
    term: { id: term.id, name: term.name, maxCredits: term.maxCredits, ratePerCredit: Number(term.ratePerCredit) },
    subjects: subjects
      .filter((subject) => subject.status !== 'PASSED' && subject.status !== 'IN_PROGRESS')
      .map((subject) => ({ ...subject, sections: sectionsBySubject.get(subject.id) ?? [] })),
    enrollment: enrollment
      ? {
          status: enrollment.status,
          amount: Number(enrollment.amount),
          sections: enrollment.details.map((detail) => toSectionView(detail.section)),
        }
      : null,
  }
}

export type Offer = NonNullable<Awaited<ReturnType<typeof listOffer>>>

async function runUseCase(useCase: () => Promise<string>): Promise<ActionResult> {
  try {
    const message = await useCase()
    revalidatePath('/student', 'layout')
    return { ok: true, message }
  } catch (error) {
    if (error instanceof DomainError) return { ok: false, message: error.message }
    throw error
  }
}

// Adds a section to the student's pre-enrollment after validating every enrollment rule.
export async function addSection(rawSectionId: string): Promise<ActionResult> {
  const parsed = sectionIdSchema.safeParse(rawSectionId)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  return runUseCase(async () => {
    const { profile, subjects } = await getStudentContext()
    const term = await findOpenTerm()
    validateTermOpen(term)

    const section = await findSectionById(parsed.data)
    if (!section || section.termId !== term!.id) throw new DomainError('La sección no pertenece al período abierto.')

    const enrollment = await findEnrollment(profile.id, term!.id)
    if (enrollment && enrollment.status !== 'PRE_ENROLLED') throw new DomainError('Tu inscripción ya no admite cambios.')

    const selected = (enrollment?.details ?? []).map((detail) => toCandidate(detail.section))
    const candidate = toCandidate(section)
    validatePrerequisites(subjects.find((subject) => subject.id === section.subjectId))
    validateSingleSectionPerSubject(selected, candidate)
    validateScheduleClash(selected, candidate)
    validateMaxCredits(selected, candidate, term!.maxCredits)

    await addSectionWithSeatLock({
      studentId: profile.id,
      termId: term!.id,
      sectionId: section.id,
      assertSeatAvailable: validateCapacity,
      computeAmount: (credits) => calculateAmount(credits, Number(term!.ratePerCredit)),
    })
    return `${section.subject.name} (sección ${section.number}) se agregó a tu pre-inscripción.`
  })
}

export async function removeSection(rawSectionId: string): Promise<ActionResult> {
  const parsed = sectionIdSchema.safeParse(rawSectionId)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  return runUseCase(async () => {
    const { profile } = await getStudentContext()
    const term = await findOpenTerm()
    validateTermOpen(term)

    const enrollment = await findEnrollment(profile.id, term!.id)
    const detail = enrollment?.details.find((item) => item.sectionId === parsed.data)
    if (!enrollment || !detail) throw new DomainError('La sección no está en tu pre-inscripción.')
    if (enrollment.status !== 'PRE_ENROLLED') throw new DomainError('Tu inscripción ya no admite cambios.')

    await removeEnrollmentSection(enrollment.id, parsed.data, (credits) => calculateAmount(credits, Number(term!.ratePerCredit)))
    return `${detail.section.subject.name} se retiró de tu pre-inscripción.`
  })
}

// Confirmed enrollment of the current term, used by the enrollment receipt.
export async function getCurrentEnrollment() {
  const { profile, currentTerm } = await getStudentContext()
  if (!currentTerm) return null
  const enrollment = await findEnrollment(profile.id, currentTerm.id)
  if (!enrollment || enrollment.status !== 'CONFIRMED') return null
  return {
    term: currentTerm.name,
    amount: Number(enrollment.amount),
    student: { name: profile.name, career: profile.career.name },
    sections: enrollment.details.map((detail) => toSectionView(detail.section)),
  }
}
