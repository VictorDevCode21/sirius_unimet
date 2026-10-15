const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV']

export function toRoman(value: number) {
  return ROMAN[value - 1] ?? String(value)
}

export function formatGrade(value: number | null | undefined) {
  return value === null || value === undefined ? '—' : value.toFixed(2)
}

export function formatLongDate(date: Date) {
  const text = new Intl.DateTimeFormat('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('es-VE', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

export function firstName(fullName: string) {
  return fullName.split(' ')[0] ?? fullName
}

const WEEKDAY_LABELS: Record<string, string> = { MON: 'Lun', TUE: 'Mar', WED: 'Mié', THU: 'Jue', FRI: 'Vie', SAT: 'Sáb' }

export function formatTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

// Groups blocks that share the same hours, e.g. "Lun/Mié 07:00–08:30".
export function formatSchedule(blocks: { weekday: string; startMinutes: number; endMinutes: number }[]) {
  const groups = new Map<string, string[]>()
  for (const block of blocks) {
    const range = `${formatTime(block.startMinutes)}–${formatTime(block.endMinutes)}`
    groups.set(range, [...(groups.get(range) ?? []), WEEKDAY_LABELS[block.weekday] ?? block.weekday])
  }
  return [...groups.entries()].map(([range, days]) => `${days.join('/')} ${range}`).join(' · ')
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value)
}
