// Section occupancy for the department head. Seats follow the shared seat rule: only confirmed (paid) enrollments
// take a seat; pre-enrolled and pending students are listed but leave the seat free.
import { countTakenSeats } from '@/domain/enrollment/seat-rules'

export type EnrollmentStatusName = 'PRE_ENROLLED' | 'PENDING' | 'CONFIRMED'

// Share of the capacity from which a section is flagged as nearly full.
export const NEARLY_FULL_RATIO = 0.9

export function isNearlyFull(enrolled: number, capacity: number) {
  return capacity > 0 && enrolled >= Math.ceil(capacity * NEARLY_FULL_RATIO)
}

export function computeOccupancy(capacity: number, statuses: EnrollmentStatusName[]) {
  const enrolled = countTakenSeats(statuses)
  return {
    capacity,
    enrolled,
    unpaid: statuses.length - enrolled,
    available: Math.max(0, capacity - enrolled),
    full: enrolled >= capacity,
    nearlyFull: isNearlyFull(enrolled, capacity),
    percent: capacity > 0 ? Math.min(100, Math.round((enrolled / capacity) * 100)) : 0,
  }
}

export type Occupancy = ReturnType<typeof computeOccupancy>

export function summarizeOccupancy(items: Occupancy[]) {
  return items.reduce(
    (total, item) => ({
      sections: total.sections + 1,
      capacity: total.capacity + item.capacity,
      enrolled: total.enrolled + item.enrolled,
      available: total.available + item.available,
      full: total.full + (item.full ? 1 : 0),
      nearlyFull: total.nearlyFull + (item.nearlyFull && !item.full ? 1 : 0),
    }),
    { sections: 0, capacity: 0, enrolled: 0, available: 0, full: 0, nearlyFull: 0 },
  )
}
