import type { SectionView } from '@/control/controllers/enrollment.controller'
import { blocksOverlap } from '@/domain/enrollment/enrollment-validator'
import { formatTime } from '@/presentation/lib/format'
import { cn } from '@/presentation/lib/utils'

const WEEKDAYS = [
  { key: 'MON', label: 'Lun' },
  { key: 'TUE', label: 'Mar' },
  { key: 'WED', label: 'Mié' },
  { key: 'THU', label: 'Jue' },
  { key: 'FRI', label: 'Vie' },
  { key: 'SAT', label: 'Sáb' },
]

const DEFAULT_START = 7 * 60
const DEFAULT_END = 13 * 60

// Compact Monday–Saturday grid with the blocks of the selected sections; overlapping blocks are marked in red.
export function WeeklySchedule({ sections }: { sections: SectionView[] }) {
  const blocks = sections.flatMap((section) =>
    section.blocks.map((block) => ({ ...block, sectionId: section.id, subjectName: section.subject.name })),
  )
  if (!blocks.length) return null

  const start = Math.min(DEFAULT_START, ...blocks.map((block) => block.startMinutes))
  const end = Math.max(DEFAULT_END, ...blocks.map((block) => block.endMinutes))
  const span = end - start
  const clashing = blocks.map((block) =>
    blocks.some((other) => other.sectionId !== block.sectionId && blocksOverlap(block, other)),
  )
  const clashCount = clashing.filter(Boolean).length

  return (
    <section className="mt-5" aria-label="Horario semanal de tu selección">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Tu semana</p>
        <p className="text-[0.65rem] text-muted-foreground">
          {formatTime(start)} – {formatTime(end)}
        </p>
      </div>
      <div className="mt-2 grid grid-cols-6 gap-1">
        {WEEKDAYS.map((day) => (
          <div key={day.key} className="min-w-0">
            <p className="pb-1 text-center text-[0.62rem] font-bold text-muted-foreground">{day.label}</p>
            <div className="relative h-36 rounded-lg bg-muted">
              {blocks.map((block, index) =>
                block.weekday === day.key ? (
                  <div
                    key={`${block.sectionId}-${index}`}
                    className={cn(
                      'absolute inset-x-0.5 overflow-hidden rounded-md px-1 text-[0.55rem] font-bold leading-tight text-white',
                      clashing[index] ? 'bg-red-600 ring-2 ring-red-300' : 'bg-[#1859a9]',
                    )}
                    style={{
                      top: `${((block.startMinutes - start) / span) * 100}%`,
                      height: `${((block.endMinutes - block.startMinutes) / span) * 100}%`,
                    }}
                    title={`${block.subjectName} · ${formatTime(block.startMinutes)}–${formatTime(block.endMinutes)}`}
                  >
                    <span className="line-clamp-2 pt-0.5">{block.subjectName}</span>
                  </div>
                ) : null,
              )}
            </div>
          </div>
        ))}
      </div>
      {clashCount > 0 && (
        <p className="mt-2 text-[0.7rem] font-semibold text-red-600 dark:text-red-400">
          Hay bloques que se solapan (en rojo). Quita una de esas secciones o elige otra.
        </p>
      )}
    </section>
  )
}
