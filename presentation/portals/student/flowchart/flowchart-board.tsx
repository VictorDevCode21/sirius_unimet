'use client'

import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, CircleX, LockKeyhole, LockKeyholeOpen, MapPin } from 'lucide-react'
import { SubjectDrawer } from '@/presentation/portals/student/flowchart/subject-drawer'
import { failedConfig, statusConfig } from '@/presentation/components/shared/status-badge'
import type { FlowchartSubject } from '@/control/controllers/flowchart.controller'
import type { SubjectStatus } from '@/domain/prerequisites/prerequisite-engine'
import { toRoman } from '@/presentation/lib/format'

interface FlowchartBoardProps {
  subjects: FlowchartSubject[]
  terms: number
  branches: number
  currentTerm: number
  statusCounts: Record<SubjectStatus, number>
}

type Filter = 'ALL' | SubjectStatus | 'FAILED'

const filters: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'PASSED', label: 'Aprobadas' },
  { value: 'IN_PROGRESS', label: 'En curso' },
  { value: 'AVAILABLE', label: 'Disponibles' },
  { value: 'BLOCKED', label: 'Bloqueadas' },
  { value: 'FAILED', label: 'Reprobadas' },
]

type Relation = 'focus' | 'prerequisite' | 'unlock'

interface Link {
  kind: Exclude<Relation, 'focus'>
  path: string
}

// Polyline through the given points with rounded corners.
function roundedPath(points: [number, number][], radius = 4) {
  let path = `M ${points[0][0]} ${points[0][1]}`
  for (let index = 1; index < points.length - 1; index++) {
    const [px, py] = points[index - 1]
    const [cx, cy] = points[index]
    const [nx, ny] = points[index + 1]
    const inLength = Math.hypot(cx - px, cy - py)
    const outLength = Math.hypot(nx - cx, ny - cy)
    if (!inLength || !outLength) continue
    const r = Math.min(radius, inLength / 2, outLength / 2)
    path += ` L ${cx - ((cx - px) / inLength) * r} ${cy - ((cy - py) / inLength) * r}`
    path += ` Q ${cx} ${cy} ${cx + ((nx - cx) / outLength) * r} ${cy + ((ny - cy) / outLength) * r}`
  }
  const [lx, ly] = points[points.length - 1]
  return `${path} L ${lx} ${ly}`
}

// Path from a card to a card of a later term that runs only through the gaps between cards: out of the source's
// right edge, along the column gap, along the row gap next to the target row, and into the target's left edge.
function linkPath(from: HTMLElement, to: HTMLElement) {
  const gap = parseFloat(getComputedStyle(from.parentElement!).columnGap) || 8
  const x1 = from.offsetLeft + from.offsetWidth
  const y1 = from.offsetTop + from.offsetHeight / 2
  const x2 = to.offsetLeft
  const y2 = to.offsetTop + to.offsetHeight / 2
  const sourceGap = x1 + gap / 2
  const targetGap = x2 - gap / 2
  const end: [number, number] = [x2 - 3, y2]
  if (targetGap - sourceGap < 2) return roundedPath([[x1, y1], [sourceGap, y1], [sourceGap, y2], end])
  const rowGap = y2 < y1 - from.offsetHeight / 2 ? to.offsetTop + to.offsetHeight + gap / 2 : to.offsetTop - gap / 2
  const sameRow = Math.abs(y2 - y1) < from.offsetHeight / 2
  const lane = sameRow ? to.offsetTop + to.offsetHeight + gap / 2 : rowGap
  return roundedPath([[x1, y1], [sourceGap, y1], [sourceGap, lane], [targetGap, lane], [targetGap, y2], end])
}

const matchesFilter = (subject: FlowchartSubject, filter: Filter) =>
  filter === 'ALL' || (filter === 'FAILED' ? subject.failed : subject.status === filter)

export function FlowchartBoard({ subjects, terms, branches, currentTerm, statusCounts }: FlowchartBoardProps) {
  const [filter, setFilter] = useState<Filter>('ALL')
  const failedCount = subjects.filter((subject) => subject.failed).length
  const [hovered, setHovered] = useState<FlowchartSubject | null>(null)
  const [selected, setSelected] = useState<FlowchartSubject | null>(null)

  const cellMap = useMemo(() => {
    const map = new Map<string, FlowchartSubject>()
    for (const subject of subjects) map.set(`${subject.term}-${subject.branch}`, subject)
    return map
  }, [subjects])

  const focus = hovered ?? selected
  const prerequisiteIds = useMemo(() => new Set(focus?.prerequisiteIds ?? []), [focus])
  const unlockIds = useMemo(() => new Set(focus?.unlocks.map((item) => item.id) ?? []), [focus])

  const cardRefs = useRef(new Map<string, HTMLButtonElement>())
  const [links, setLinks] = useState<Link[]>([])

  useLayoutEffect(() => {
    if (!focus) return setLinks([])
    const focusCard = cardRefs.current.get(focus.id)
    if (!focusCard) return setLinks([])
    const next: Link[] = []
    for (const id of prerequisiteIds) {
      const card = cardRefs.current.get(id)
      if (card) next.push({ kind: 'prerequisite', path: linkPath(card, focusCard) })
    }
    for (const id of unlockIds) {
      const card = cardRefs.current.get(id)
      if (card) next.push({ kind: 'unlock', path: linkPath(focusCard, card) })
    }
    setLinks(next)
  }, [focus, prerequisiteIds, unlockIds])

  const relationOf = (subject: FlowchartSubject): Relation | null =>
    !focus ? null : focus.id === subject.id ? 'focus' : prerequisiteIds.has(subject.id) ? 'prerequisite' : unlockIds.has(subject.id) ? 'unlock' : null

  const renderCard = (subject: FlowchartSubject) => {
    const relation = relationOf(subject)
    const dimmed = !matchesFilter(subject, filter) || (focus && !relation)
    return (
      <button
        type="button"
        key={subject.id}
        ref={(node) => {
          if (node) cardRefs.current.set(subject.id, node)
          else cardRefs.current.delete(subject.id)
        }}
        className={`subject-card subject-${subject.status}`}
        data-dimmed={Boolean(dimmed)}
        data-relation={relation ?? undefined}
        onMouseEnter={() => setHovered(subject)}
        onMouseLeave={() => setHovered(null)}
        onFocus={() => setHovered(subject)}
        onBlur={() => setHovered(null)}
        onClick={() => setSelected(subject)}
      >
        {relation === 'prerequisite' && (
          <span className="relation-tag" data-kind="prerequisite">
            <ArrowRight aria-hidden="true" /> Prelación
          </span>
        )}
        {relation === 'unlock' && (
          <span className="relation-tag" data-kind="unlock">
            <LockKeyholeOpen aria-hidden="true" /> Prelada
          </span>
        )}
        <div className="flex items-start justify-between gap-2">
          <span className="subject-code">{subject.code}</span>
          {subject.status === 'BLOCKED' && <LockKeyhole className="h-3.5 w-3.5 opacity-50" aria-label="Bloqueada" />}
          {subject.status === 'AVAILABLE' && (
            <LockKeyholeOpen className="h-3.5 w-3.5 text-[var(--status-available)]" aria-label="Disponible" />
          )}
          {subject.status === 'PASSED' && <span className="h-2 w-2 rounded-full bg-[var(--status-passed)]" aria-label="Aprobada" />}
          {subject.status === 'IN_PROGRESS' && <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--status-progress)]" aria-label="En curso" />}
        </div>
        {subject.failed && (
          <span className="subject-failed-badge mt-1.5">
            <CircleX aria-hidden="true" /> {failedConfig.label}
          </span>
        )}
        <p className="mt-2 line-clamp-3 text-[0.8rem] font-semibold leading-tight">{subject.name}</p>
        <div className="mt-auto flex items-center justify-between pt-3 text-[0.66rem] font-semibold opacity-70">
          <span>{subject.credits} UC</span>
          <span>
            {subject.passingGrade
              ? `${statusConfig.PASSED.label} · ${subject.passingGrade.value}`
              : subject.pendingRequirements.length
                ? `Faltan ${subject.pendingRequirements.length}`
                : statusConfig[subject.status].label}
          </span>
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
              Al señalar una materia se resaltan sus prelaciones y las materias que esta prela.
            </p>
            <div className="mt-2 flex flex-wrap gap-4">
              <span className="legend-relation">
                <i style={{ background: 'var(--relation-prerequisite)' }} /> Prelaciones de la materia
              </span>
              <span className="legend-relation">
                <i style={{ background: 'var(--relation-unlock)' }} /> Materias que prela
              </span>
            </div>
          </div>
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <div className="segmented" role="group" aria-label="Filtrar por estado">
              {filters.map((item) => (
                <button key={item.value} type="button" aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>
                  {item.label}
                  <span className="ml-1.5 tabular-nums opacity-60">{item.value === 'ALL' ? subjects.length : item.value === 'FAILED' ? failedCount : statusCounts[item.value]}</span>
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
                  <div key={`empty-${periodIndex}-${rowIndex}`} className="min-h-[var(--subject-card-height)] rounded-[var(--card-radius-sm)] border border-dashed border-border" />
                )
              }),
            )}
            {links.length > 0 && (
              <svg className="flow-links" aria-hidden="true">
                <defs>
                  {(['prerequisite', 'unlock'] as const).map((kind) => (
                    <marker key={kind} id={`flow-arrow-${kind}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" style={{ fill: `var(--relation-${kind})`, stroke: 'none', animation: 'none' }} />
                    </marker>
                  ))}
                </defs>
                {links.map((link, index) => (
                  <path key={index} d={link.path} style={{ stroke: `var(--relation-${link.kind})` }} markerEnd={`url(#flow-arrow-${link.kind})`} />
                ))}
              </svg>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border p-5 sm:px-6">
          {(Object.keys(statusConfig) as SubjectStatus[]).map((status) => (
            <span key={status} className="legend-dot">
              <i style={{ background: statusConfig[status].color }} />
              {statusConfig[status].label} ({statusCounts[status]})
            </span>
          ))}
          <span className="legend-dot">
            <i style={{ background: failedConfig.color }} />
            {failedConfig.label} (sigue pendiente)
          </span>
        </div>
      </section>

      {selected && <SubjectDrawer subject={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
