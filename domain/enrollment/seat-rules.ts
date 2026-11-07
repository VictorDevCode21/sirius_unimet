// Seat rules: a seat is taken only by a confirmed (paid) enrollment, so pre-enrollments never hold seats.
// Detects full sections in a selection and suggests another section of the same subject with seats left.
import { blocksOverlap, type TimeBlock } from '@/domain/enrollment/enrollment-validator'
import { seatsLeft } from '@/domain/enrollment/offer-rules'
import { DomainError } from '@/domain/shared/domain-error'
import { formatSchedule } from '@/domain/shared/schedule-format'

export interface SelectedSeat {
  sectionId: string
  sectionNumber: number
  subjectId: string
  subjectName: string
  capacity: number
  // Seats taken by other students' confirmed enrollments.
  taken: number
  blocks: TimeBlock[]
}

export interface AlternativeSection {
  sectionId: string
  number: number
  professor: string
  capacity: number
  taken: number
  blocks: TimeBlock[]
}

export interface FullSection {
  sectionId: string
  sectionNumber: number
  subjectName: string
  alternative: (AlternativeSection & { seatsLeft: number }) | null
}

export function findFullSeats(seats: SelectedSeat[]) {
  return seats.filter((seat) => seatsLeft(seat.capacity, seat.taken) === 0)
}

// Picks the alternative with seats left, preferring one that fits the rest of the selection and then the most seats.
export function pickAlternative(alternatives: AlternativeSection[], otherBlocks: TimeBlock[]) {
  const withSeats = alternatives
    .map((alternative) => ({ ...alternative, seatsLeft: seatsLeft(alternative.capacity, alternative.taken) }))
    .filter((alternative) => alternative.seatsLeft > 0)
  const fits = (alternative: AlternativeSection) =>
    !alternative.blocks.some((block) => otherBlocks.some((other) => blocksOverlap(block, other)))
  const ranked = [...withSeats].sort((a, b) => Number(fits(b)) - Number(fits(a)) || b.seatsLeft - a.seatsLeft || a.number - b.number)
  return ranked[0] ?? null
}

// Full sections of a selection, each with the suggested alternative of the same subject (or null when none has seats).
export function evaluateSeats(seats: SelectedSeat[], alternativesBySubject: Map<string, AlternativeSection[]>): FullSection[] {
  return findFullSeats(seats).map((seat) => {
    const otherBlocks = seats.filter((other) => other.sectionId !== seat.sectionId).flatMap((other) => other.blocks)
    return {
      sectionId: seat.sectionId,
      sectionNumber: seat.sectionNumber,
      subjectName: seat.subjectName,
      alternative: pickAlternative(alternativesBySubject.get(seat.subjectId) ?? [], otherBlocks),
    }
  })
}

export function fullSectionMessage(full: FullSection) {
  const base = `La sección ${full.sectionNumber} de ${full.subjectName} se llenó.`
  if (!full.alternative) return `${base} No hay otra sección de esta materia con cupo en el período; quítala de tu selección.`
  const { number, professor, blocks, seatsLeft: left } = full.alternative
  return `${base} Te sugerimos la sección ${number} (${professor}, ${formatSchedule(blocks)}), que tiene ${left} ${left === 1 ? 'cupo' : 'cupos'}.`
}

// Rejects the confirmation when any selected section is full, naming each one with its suggested alternative.
export function assertSeatsAvailable(fullSections: FullSection[]) {
  if (fullSections.length) throw new DomainError(fullSections.map(fullSectionMessage).join(' '))
}
