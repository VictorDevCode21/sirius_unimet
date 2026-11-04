// Enrollment validator: open term, prerequisites, one section per subject, schedule clashes,
// maximum credits and section capacity.
import { DomainError } from '@/domain/shared/domain-error'
import { formatSchedule } from '@/domain/shared/schedule-format'
import type { SubjectState } from '@/domain/prerequisites/prerequisite-engine'

export interface TimeBlock {
  weekday: string
  startMinutes: number
  endMinutes: number
}

export interface SectionCandidate {
  id: string
  number?: number
  subjectId: string
  subjectName: string
  credits: number
  blocks: TimeBlock[]
}

export function validateTermOpen(term: { open: boolean } | null) {
  if (!term?.open) throw new DomainError('No hay un período de pre-inscripción abierto. Revisa el calendario académico y vuelve a intentarlo cuando se abra.')
}

// Joins items as a Spanish list: "a", "a y b", "a, b y c".
export function joinList(items: string[]) {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`
}

// Names every unmet prerequisite of a blocked subject, plus the credit alternative when the subject has one.
export function missingPrerequisitesMessage(subject: Pick<SubjectState, 'name' | 'requirements'>) {
  const missing = subject.requirements.filter((requirement) => !requirement.met && !requirement.isAlternative)
  const alternative = subject.requirements.find((requirement) => requirement.isAlternative)
  const detail = missing.length ? joinList(missing.map((requirement) => requirement.label)) : 'las prelaciones del plan'
  return `No puedes inscribir ${subject.name}. Te falta: ${detail}${alternative ? ` (o ${alternative.label})` : ''}.`
}

export function validatePrerequisites(subject: SubjectState | undefined) {
  if (!subject) throw new DomainError('La materia no pertenece a tu plan de estudios. Elige una materia de tu flujograma.')
  if (subject.status === 'PASSED') throw new DomainError('Ya aprobaste esta materia. Elige otra materia disponible de tu flujograma.')
  if (subject.status === 'IN_PROGRESS') throw new DomainError('Ya estás cursando esta materia este período. Podrás inscribir las que desbloquea cuando la apruebes.')
  if (subject.status === 'BLOCKED') throw new DomainError(missingPrerequisitesMessage(subject))
}

export function validateSingleSectionPerSubject(selected: SectionCandidate[], candidate: SectionCandidate) {
  const current = selected.find((section) => section.subjectId === candidate.subjectId)
  if (current) {
    const label = current.number ? `la sección ${current.number}` : 'una sección'
    throw new DomainError(
      `Ya tienes ${label} de ${candidate.subjectName} en tu pre-inscripción. Usa «Reemplazar» para cambiarla por esta.`,
    )
  }
}

// Checks that a replacement swaps a selected section for another section of the same subject and returns the
// selection without the replaced section, so the remaining rules can be validated against it.
export function validateReplacement(selected: SectionCandidate[], replacedSectionId: string, candidate: SectionCandidate) {
  const replaced = selected.find((section) => section.id === replacedSectionId)
  if (!replaced) throw new DomainError('La sección que quieres reemplazar ya no está en tu pre-inscripción. Recarga la página.')
  if (replaced.subjectId !== candidate.subjectId) {
    throw new DomainError('Solo puedes reemplazar una sección por otra de la misma materia.')
  }
  if (replaced.id === candidate.id) throw new DomainError('Esa sección ya está en tu pre-inscripción.')
  return selected.filter((section) => section.id !== replacedSectionId)
}

export function blocksOverlap(a: TimeBlock, b: TimeBlock) {
  return a.weekday === b.weekday && a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes
}

// First selected section whose schedule overlaps the candidate, with the overlapping blocks of that section.
export function findScheduleClash(selected: SectionCandidate[], candidate: SectionCandidate) {
  for (const section of selected) {
    const blocks = section.blocks.filter((block) => candidate.blocks.some((other) => blocksOverlap(block, other)))
    if (blocks.length) return { section, blocks }
  }
  return null
}

export function validateScheduleClash(selected: SectionCandidate[], candidate: SectionCandidate) {
  const clash = findScheduleClash(selected, candidate)
  if (clash) {
    const { subjectName } = clash.section
    throw new DomainError(
      `El horario choca con ${subjectName} (${formatSchedule(clash.blocks)}). Quita ${subjectName} de tu selección o elige otra sección.`,
    )
  }
}

export function validateMaxCredits(selected: SectionCandidate[], candidate: SectionCandidate, maxCredits: number) {
  const total = selected.reduce((sum, section) => sum + section.credits, 0) + candidate.credits
  if (total > maxCredits) {
    throw new DomainError(`Superas el máximo de ${maxCredits} créditos del período. Quita una materia para agregar esta.`)
  }
}

export function validateCapacity(occupied: number, capacity: number) {
  if (occupied >= capacity) throw new DomainError('La sección no tiene cupos disponibles. Elige otra sección de la materia si la hay.')
}
