// Schedule rules for sections: valid time range, no overlaps inside a section and no overlapping blocks for the
// same professor in a term.
import { blocksOverlap, type TimeBlock } from '@/domain/enrollment/enrollment-validator'
import { DomainError } from '@/domain/shared/domain-error'

export const SCHEDULE_DAY_START = 7 * 60
export const SCHEDULE_DAY_END = 22 * 60
export const MIN_BLOCK_MINUTES = 30
export const BLOCK_STEP_MINUTES = 5

const WEEKDAY_NAMES: Record<string, string> = { MON: 'lunes', TUE: 'martes', WED: 'miércoles', THU: 'jueves', FRI: 'viernes', SAT: 'sábado' }

const clock = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

export const describeBlock = (block: TimeBlock) => `${WEEKDAY_NAMES[block.weekday] ?? block.weekday} ${clock(block.startMinutes)}–${clock(block.endMinutes)}`

// Converts "HH:MM" to minutes after midnight; null when the text is not a valid time.
export function parseClock(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value)
  return match ? Number(match[1]) * 60 + Number(match[2]) : null
}

export function validateBlockRange(block: TimeBlock) {
  if (!(block.weekday in WEEKDAY_NAMES)) throw new DomainError('Elige un día entre lunes y sábado.')
  if (block.endMinutes <= block.startMinutes) throw new DomainError('La hora de fin debe ser posterior a la hora de inicio.')
  if (block.startMinutes < SCHEDULE_DAY_START || block.endMinutes > SCHEDULE_DAY_END) {
    throw new DomainError(`El horario debe estar entre las ${clock(SCHEDULE_DAY_START)} y las ${clock(SCHEDULE_DAY_END)}.`)
  }
  if (block.endMinutes - block.startMinutes < MIN_BLOCK_MINUTES) {
    throw new DomainError(`Cada bloque debe durar al menos ${MIN_BLOCK_MINUTES} minutos.`)
  }
  if (block.startMinutes % BLOCK_STEP_MINUTES || block.endMinutes % BLOCK_STEP_MINUTES) {
    throw new DomainError(`Usa horas en múltiplos de ${BLOCK_STEP_MINUTES} minutos (por ejemplo 07:00 o 08:45).`)
  }
}

// One block per chosen weekday with the same time range, each one checked with the block range rules.
export function buildWeeklyBlocks<Day extends string>(weekdays: Day[], startMinutes: number, endMinutes: number) {
  if (!weekdays.length) throw new DomainError('Elige al menos un día de clase.')
  if (new Set(weekdays).size !== weekdays.length) throw new DomainError('Cada día se puede elegir una sola vez.')
  const blocks = weekdays.map((weekday) => ({ weekday, startMinutes, endMinutes }))
  blocks.forEach(validateBlockRange)
  return blocks
}

export function validateNoOverlapInSection(existing: TimeBlock[], candidate: TimeBlock) {
  const clash = existing.find((block) => blocksOverlap(block, candidate))
  if (clash) throw new DomainError(`El bloque se solapa con otro bloque de la misma sección (${describeBlock(clash)}).`)
}

export interface ProfessorBlock extends TimeBlock {
  subjectName: string
  sectionNumber: number
}

// The professor cannot teach two sections at the same time in the same term.
export function validateProfessorAvailability(professorName: string, professorBlocks: ProfessorBlock[], candidates: TimeBlock[]) {
  for (const candidate of candidates) {
    const clash = professorBlocks.find((block) => blocksOverlap(block, candidate))
    if (clash) {
      throw new DomainError(
        `${professorName} ya dicta ${clash.subjectName} (sección ${clash.sectionNumber}) el ${describeBlock(clash)}. Elige otra hora u otro profesor.`,
      )
    }
  }
}

// Changing the schedule of a section with students would break the clash checks they already passed.
export function validateScheduleChangeAllowed(occupied: number) {
  if (occupied > 0) {
    throw new DomainError(
      `La sección tiene ${occupied} ${occupied === 1 ? 'estudiante inscrito' : 'estudiantes inscritos'}; su horario no se puede cambiar. Crea otra sección con el horario nuevo.`,
    )
  }
}
