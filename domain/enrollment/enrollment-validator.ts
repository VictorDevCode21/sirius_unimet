// Enrollment validator: open term, prerequisites, one section per subject, schedule clashes,
// maximum credits and section capacity.
import { DomainError } from '@/domain/shared/domain-error'
import type { SubjectState } from '@/domain/prerequisites/prerequisite-engine'

export interface TimeBlock {
  weekday: string
  startMinutes: number
  endMinutes: number
}

export interface SectionCandidate {
  id: string
  subjectId: string
  subjectName: string
  credits: number
  blocks: TimeBlock[]
}

export function validateTermOpen(term: { open: boolean } | null) {
  if (!term?.open) throw new DomainError('No hay un período de inscripción abierto.')
}

export function validatePrerequisites(subject: SubjectState | undefined) {
  if (!subject) throw new DomainError('La materia no pertenece a tu plan de estudios.')
  if (subject.status === 'PASSED') throw new DomainError('Ya aprobaste esta materia.')
  if (subject.status === 'IN_PROGRESS') throw new DomainError('Ya estás cursando esta materia.')
  if (subject.status === 'BLOCKED') throw new DomainError('No cumples las prelaciones de esta materia.')
}

export function validateSingleSectionPerSubject(selected: SectionCandidate[], candidate: SectionCandidate) {
  if (selected.some((section) => section.subjectId === candidate.subjectId)) {
    throw new DomainError(`Ya tienes una sección de ${candidate.subjectName} en tu pre-inscripción.`)
  }
}

export function blocksOverlap(a: TimeBlock, b: TimeBlock) {
  return a.weekday === b.weekday && a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes
}

export function validateScheduleClash(selected: SectionCandidate[], candidate: SectionCandidate) {
  const clash = selected.find((section) =>
    section.blocks.some((block) => candidate.blocks.some((other) => blocksOverlap(block, other))),
  )
  if (clash) throw new DomainError(`El horario choca con ${clash.subjectName}.`)
}

export function validateMaxCredits(selected: SectionCandidate[], candidate: SectionCandidate, maxCredits: number) {
  const total = selected.reduce((sum, section) => sum + section.credits, 0) + candidate.credits
  if (total > maxCredits) throw new DomainError(`Superas el máximo de ${maxCredits} créditos del período.`)
}

export function validateCapacity(occupied: number, capacity: number) {
  if (occupied >= capacity) throw new DomainError('La sección no tiene cupos disponibles.')
}
