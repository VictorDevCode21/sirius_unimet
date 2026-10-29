'use client'

import { useMemo, useState } from 'react'
import { LockKeyhole, LockKeyholeOpen, MapPin } from 'lucide-react'
import { SubjectDrawer } from '@/presentation/portals/student/flowchart/subject-drawer'
import { statusConfig } from '@/presentation/components/shared/status-badge'
import type { FlowchartSubject } from '@/control/controllers/flowchart.controller'
import type { SubjectStatus } from '@/domain/prerequisites/prerequisite-engine'
import { toRoman } from '@/presentation/lib/format'
import { cn } from '@/presentation/lib/utils'

interface FlowchartBoardProps {
  subjects: FlowchartSubject[]
  terms: number
  branches: number
  currentTerm: number
}

type Filter = 'ALL' | SubjectStatus

const filters: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'PASSED', label: 'Aprobadas' },
  { value: 'IN_PROGRESS', label: 'En curso' },
  { value: 'AVAILABLE', label: 'Disponibles' },
  { value: 'BLOCKED', label: 'Bloqueadas' },
]

export function FlowchartBoard({ subjects, terms, branches, currentTerm }: FlowchartBoardProps) {
  const [filter, setFilter] = useState<Filter>('ALL')
  const [hovered, setHovered] = useState<FlowchartSubject | null>(null)
  const [selected, setSelected] = useState<FlowchartSubject | null>(null)

  const cellMap = useMemo(() => {
    const map = new Map<string, FlowchartSubject>()
    for (const subject of subjects) map.set(`${subject.term}-${subject.branch}`, subject)
    return map
  }, [subjects])

  const focus = hovered ?? selected
  const relatedPrerequisites = new Set(focus?.prerequisiteIds ?? [])
  const relatedUnlocks = new Set(focus?.unlocks.map((item) => item.id) ?? [])

  const renderCard = (subject: FlowchartSubject) => {
    const isFocus = focus?.id === subject.id
    const isRelated = relatedPrerequisites.has(subject.id) || relatedUnlocks.has(subject.id)
    const dimmed = (filter !== 'ALL' && subject.status !== filter) || (focus && !isFocus && !isRelated)
    return (
      <button
        type="button"
        key={subject.id}
        className={`subject-card subject-${subject.status}`}
        data-dimmed={Boolean(dimmed)}
        data-highlight={Boolean(focus && relatedUnlocks.has(subject.id))}
        data-selected={Boolean(focus && (isFocus || relatedPrerequisites.has(subject.id)))}
        onMouseEnter={() => setHovered(subject)}
        onMouseLeave={() => setHovered(null)}
        onFocus={() => setHovered(subject)}
        onBlur={() => setHovered(null)}
        onClick={() => setSelected(subject)}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="subject-code">{subject.code}</span>
          {subject.status === 'BLOCKED' && <LockKeyhole className="h-3.5 w-3.5 opacity-50" aria-label="Bloqueada" />}
          {subject.status === 'AVAILABLE' && (
            <LockKeyholeOpen className="h-3.5 w-3.5 text-[var(--status-available)]" aria-label="Disponible" />
          )}
          {subject.status === 'PASSED' && <span className="h-2 w-2 rounded-full bg-[var(--status-passed)]" aria-label="Aprobada" />}
          {subject.status === 'IN_PROGRESS' && <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--status-progress)]" aria-label="En curso" />}
        </div>
        <p className="mt-2 line-clamp-3 text-[0.8rem] font-semibold leading-tight">{subject.name}</p>
        <div className="mt-auto flex items-center justify-between pt-3 text-[0.66rem] font-semibold opacity-70">
          <span>{subject.credits} UC</span>
          <span>{statusConfig[subject.status].label}</span>
        </div>
      </button>
    )
  }

  return (
    <>
      <section className="surface reveal reveal-2 overflow-hidden" aria-labelledby="flowchart-title">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:p-6 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div>
            <h2 id="flowchart-title" className="text-lg font-bold">
              Componentes educativos obligatorios
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pasa el cursor sobre una materia para ver sus prelaciones (azul) y lo que desbloquea (naranja).
            </p>
          </div>
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <div className="segmented" role="group" aria-label="Filtrar por estado">
              {filters.map((item) => (
                <button key={item.value} type="button" aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto p-4 sm:p-6" style={{ scrollbarWidth: 'thin' }}>
          <div className="flow-board min-w-max" style={{ '--periods': terms } as React.CSSProperties}>
            {Array.from({ length: terms }, (_, index) => index + 1).map((term) => (
              <div key={`head-${term}`} className="flow-period-head" data-current={term === currentTerm}>
                <strong>{toRoman(term)}</strong>
                {term === currentTerm ? (
                  <small className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" aria-hidden="true" /> ESTÁS AQUÍ
                  </small>
                ) : (
                  <small>TRIMESTRE</small>
                )}
              </div>
            ))}
            {Array.from({ length: branches }, (_, rowIndex) =>
              Array.from({ length: terms }, (_, periodIndex) => {
                const subject = cellMap.get(`${periodIndex + 1}-${rowIndex + 1}`)
                return subject ? (
                  renderCard(subject)
                ) : (
                  <div key={`empty-${periodIndex}-${rowIndex}`} className="min-h-[8.25rem] rounded-[1.15rem] border border-dashed border-border" />
                )
              }),
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border p-5 sm:px-6">
          {(Object.keys(statusConfig) as SubjectStatus[]).map((status) => (
            <span key={status} className="legend-dot">
              <i style={{ background: statusConfig[status].color }} />
              {statusConfig[status].label}
            </span>
          ))}
        </div>
      </section>

      {selected && <SubjectDrawer subject={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
