// Section occupancy: every enrollment detail holds a seat (pre-enrolled, pending payment or confirmed), the same
// rule the seat assignment uses; confirmed students are those with an approved payment.
export type EnrollmentStatusName = 'PRE_ENROLLED' | 'PENDING' | 'CONFIRMED'

export function computeOccupancy(capacity: number, statuses: EnrollmentStatusName[]) {
  const enrolled = statuses.length
  const confirmed = statuses.filter((status) => status === 'CONFIRMED').length
  return {
    capacity,
    enrolled,
    confirmed,
    unpaid: enrolled - confirmed,
    available: Math.max(0, capacity - enrolled),
    full: enrolled >= capacity,
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
    }),
    { sections: 0, capacity: 0, enrolled: 0, available: 0, full: 0 },
  )
}
