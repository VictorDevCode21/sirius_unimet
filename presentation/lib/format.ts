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

// Formats a date-only database value (stored at UTC midnight) without shifting it to the local time zone.
export function formatCalendarDate(date: Date) {
  return new Intl.DateTimeFormat('es-VE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date)
}

export function firstName(fullName: string) {
  return fullName.split(' ')[0] ?? fullName
}

export { formatSchedule, formatTime } from '@/domain/shared/schedule-format'

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value)
}
