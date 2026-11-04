'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock, LoaderCircle, Plus, Trash2 } from 'lucide-react'
import { addScheduleBlock, removeScheduleBlock, type SectionActionResult } from '@/control/controllers/section-management.controller'
import type { ManagedSectionView } from '@/control/controllers/section-management.queries'
import { SCHEDULE_DAY_END, SCHEDULE_DAY_START, describeBlock } from '@/domain/sections/schedule-rules'
import { formatTime } from '@/presentation/lib/format'
import { ActionMessage } from '@/presentation/portals/department-head/sections/section-editor'

const weekdays = [
  { value: 'MON', label: 'Lunes' },
  { value: 'TUE', label: 'Martes' },
  { value: 'WED', label: 'Miércoles' },
  { value: 'THU', label: 'Jueves' },
  { value: 'FRI', label: 'Viernes' },
  { value: 'SAT', label: 'Sábado' },
] as const

const controlClass = 'min-w-0 flex-1 border-0 bg-transparent py-3 text-[0.95rem] text-foreground outline-0'

// Weekly blocks of a section with forms to add and remove them.
export function ScheduleEditor({ section }: { section: ManagedSectionView }) {
  const router = useRouter()
  const [weekday, setWeekday] = useState<(typeof weekdays)[number]['value']>('MON')
  const [start, setStart] = useState('07:00')
  const [end, setEnd] = useState('08:30')
  const [pending, setPending] = useState<string | null>(null)
  const [result, setResult] = useState<SectionActionResult | null>(null)
  const locked = !section.term.editable || section.occupied > 0

  const run = async (key: string, action: () => Promise<SectionActionResult>) => {
    if (pending) return
    setPending(key)
    setResult(null)
    try {
      const response = await action()
      setResult(response)
      if (response.ok) router.refresh()
    } finally {
      setPending(null)
    }
  }

  const add = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    run('add', () => addScheduleBlock({ sectionId: section.id, weekday, start, end }))
  }

  return (
    <section className="surface reveal reveal-3 mt-5 p-5 sm:p-7" aria-labelledby="schedule-title">
      <div className="flex items-center gap-3">
        <span className="stat-icon bg-[#1859a9]/12 text-[var(--accent-text)]">
          <CalendarClock aria-hidden="true" />
        </span>
        <div>
          <h2 id="schedule-title" className="text-lg font-bold">
            Horario
          </h2>
          <p className="text-xs text-muted-foreground">
            Bloques semanales entre {formatTime(SCHEDULE_DAY_START)} y {formatTime(SCHEDULE_DAY_END)}. El profesor no puede tener dos bloques a la misma hora.
          </p>
        </div>
      </div>

      {section.blocks.length ? (
        <ul className="mt-5 flex flex-col gap-2">
          {section.blocks.map((block) => (
            <li key={block.id} className="flex items-center gap-3 rounded-2xl bg-muted p-3">
              <span className="flex-1 text-sm font-semibold first-letter:uppercase">{describeBlock(block)}</span>
              {!locked && (
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-red-500/10 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
                  onClick={() => run(block.id, () => removeScheduleBlock({ sectionId: section.id, blockId: block.id }))}
                  disabled={pending !== null}
                  aria-label={`Quitar bloque del ${describeBlock(block)}`}
                >
                  {pending === block.id ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
          La sección aún no tiene horario. Los estudiantes la verán como «Sin horario» en la oferta.
        </p>
      )}

      {locked ? (
        <p className="mt-4 text-sm text-muted-foreground" role="note">
          {section.term.editable
            ? `El horario no se puede cambiar porque la sección tiene ${section.occupied} ${section.occupied === 1 ? 'estudiante inscrito' : 'estudiantes inscritos'}.`
            : 'El período finalizó; el horario es solo de consulta.'}
        </p>
      ) : (
        <form className="mt-5 grid gap-3 sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-end" onSubmit={add} noValidate>
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            Día
            <span className="field">
              <select className={`${controlClass} cursor-pointer`} value={weekday} onChange={(event) => setWeekday(event.target.value as typeof weekday)}>
                {weekdays.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </span>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            Inicio
            <span className="field">
              <input className={controlClass} type="time" step={300} min="07:00" max="22:00" value={start} onChange={(event) => setStart(event.target.value)} />
            </span>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            Fin
            <span className="field">
              <input className={controlClass} type="time" step={300} min="07:00" max="22:00" value={end} onChange={(event) => setEnd(event.target.value)} />
            </span>
          </label>
          <button type="submit" className="primary-button" disabled={pending !== null}>
            {pending === 'add' ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
            Agregar bloque
          </button>
        </form>
      )}

      <div className="mt-4">
        <ActionMessage result={result} />
      </div>
    </section>
  )
}
