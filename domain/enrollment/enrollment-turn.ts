// Enrollment turns: the enrollment of a term lasts two days, from 7:00 to 17:00 (Caracas time) each day, split in
// hourly turns. Students in their first trimester enroll in the first hour of the first day; the rest are ordered by
// their cumulative academic index (IAA) and then by the average of their last term, best first, and spread over the
// hourly turns of both days.

export const ENROLLMENT_DAYS = 2
export const ENROLLMENT_DAY_START_HOUR = 7
export const ENROLLMENT_DAY_END_HOUR = 17
export const TURNS_PER_DAY = ENROLLMENT_DAY_END_HOUR - ENROLLMENT_DAY_START_HOUR
export const TURN_COUNT = ENROLLMENT_DAYS * TURNS_PER_DAY
// Venezuela keeps UTC−4 all year.
const CARACAS_OFFSET_HOURS = 4

export interface GradeRecord {
  value: number
  credits: number
  termStartsAt: Date
}

const round2 = (value: number) => Math.round(value * 100) / 100

// Cumulative academic index: average of every published grade weighted by the credits of its subject.
export function computeIaa(grades: GradeRecord[]) {
  const credits = grades.reduce((sum, grade) => sum + grade.credits, 0)
  if (!credits) return null
  return round2(grades.reduce((sum, grade) => sum + grade.value * grade.credits, 0) / credits)
}

// Credit-weighted average of the grades of the most recent term the student has grades in.
export function computeLastTermAverage(grades: GradeRecord[]) {
  if (!grades.length) return null
  const latest = Math.max(...grades.map((grade) => grade.termStartsAt.getTime()))
  return computeIaa(grades.filter((grade) => grade.termStartsAt.getTime() === latest))
}

// Moment of a turn: `turn` 0 is 7:00 of the first day, `TURN_COUNT - 1` is 16:00 of the second day.
export function turnStartsAt(enrollmentStartsAt: Date, turn: number) {
  const day = Math.floor(turn / TURNS_PER_DAY)
  const hour = ENROLLMENT_DAY_START_HOUR + (turn % TURNS_PER_DAY)
  return new Date(
    Date.UTC(enrollmentStartsAt.getUTCFullYear(), enrollmentStartsAt.getUTCMonth(), enrollmentStartsAt.getUTCDate() + day, hour + CARACAS_OFFSET_HOURS),
  )
}

// First moment and end of the enrollment window of a term.
export function enrollmentWindow(enrollmentStartsAt: Date) {
  const opensAt = turnStartsAt(enrollmentStartsAt, 0)
  const lastDay = new Date(enrollmentStartsAt.getTime() + (ENROLLMENT_DAYS - 1) * 86_400_000)
  const closesAt = new Date(
    Date.UTC(lastDay.getUTCFullYear(), lastDay.getUTCMonth(), lastDay.getUTCDate(), ENROLLMENT_DAY_END_HOUR + CARACAS_OFFSET_HOURS),
  )
  return { opensAt, closesAt }
}

export interface TurnCandidate {
  studentId: string
  iaa: number | null
  lastTermAverage: number | null
}

// Turn index of every student. Students without grades (first trimester) get turn 0.
export function assignTurns(candidates: TurnCandidate[]) {
  const turns = new Map<string, number>()
  const returning = candidates
    .filter((candidate) => candidate.iaa !== null)
    .sort(
      (a, b) =>
        b.iaa! - a.iaa! || (b.lastTermAverage ?? 0) - (a.lastTermAverage ?? 0) || a.studentId.localeCompare(b.studentId),
    )
  for (const candidate of candidates) if (candidate.iaa === null) turns.set(candidate.studentId, 0)
  returning.forEach((candidate, rank) => turns.set(candidate.studentId, Math.floor((rank * TURN_COUNT) / returning.length)))
  return turns
}

export type TurnState = 'NOT_SCHEDULED' | 'UPCOMING' | 'ACTIVE' | 'CLOSED'

// Whether the student can enroll now: from the start of their turn until the enrollment window closes.
export function turnState(now: Date, turnAt: Date | null, closesAt: Date | null): TurnState {
  if (!turnAt || !closesAt) return 'NOT_SCHEDULED'
  if (now >= closesAt) return 'CLOSED'
  return now >= turnAt ? 'ACTIVE' : 'UPCOMING'
}
