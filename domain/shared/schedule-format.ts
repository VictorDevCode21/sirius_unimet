// Human-readable schedules (in Spanish, as shown to students) shared by domain messages and the interface.
export interface ScheduleBlockLike {
  weekday: string
  startMinutes: number
  endMinutes: number
}

const WEEKDAY_LABELS: Record<string, string> = { MON: 'Lun', TUE: 'Mar', WED: 'Mié', THU: 'Jue', FRI: 'Vie', SAT: 'Sáb' }

export function formatTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

// Groups blocks that share the same hours, e.g. "Lun/Mié 07:00–08:30".
export function formatSchedule(blocks: ScheduleBlockLike[]) {
  const groups = new Map<string, string[]>()
  for (const block of blocks) {
    const range = `${formatTime(block.startMinutes)}–${formatTime(block.endMinutes)}`
    groups.set(range, [...(groups.get(range) ?? []), WEEKDAY_LABELS[block.weekday] ?? block.weekday])
  }
  return [...groups.entries()].map(([range, days]) => `${days.join('/')} ${range}`).join(' · ')
}
