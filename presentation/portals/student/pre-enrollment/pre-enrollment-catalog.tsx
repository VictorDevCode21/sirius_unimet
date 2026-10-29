'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Info,
  LoaderCircle,
  LockKeyhole,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  Trash2,
  UserRound,
  UsersRound,
  X,
  XCircle,
} from 'lucide-react'
import { addSection, removeSection, type ActionResult, type Offer, type SectionView } from '@/control/controllers/enrollment.controller'
import { blocksOverlap } from '@/domain/enrollment/enrollment-validator'
import { StatusBadge } from '@/presentation/components/shared/status-badge'
import { formatCurrency, formatSchedule, toRoman } from '@/presentation/lib/format'
import { SubjectDrawer } from '@/presentation/portals/student/flowchart/subject-drawer'
import { cn } from '@/presentation/lib/utils'

type View = 'AVAILABLE' | 'UNAVAILABLE'
type SortKey = 'TERM' | 'SEATS' | 'NAME'
type OfferSubject = Offer['subjects'][number]

// Toast message; `undoSectionId` offers re-adding a section that was just removed.
interface Toast extends ActionResult {
  undoSectionId?: string
}

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'TERM', label: 'Trimestre' },
  { value: 'SEATS', label: 'Cupos disponibles' },
  { value: 'NAME', label: 'Nombre' },
]

// Highest number of free seats among the subject's sections.
const freeSeats = (subject: OfferSubject) =>
  Math.max(0, ...subject.sections.map((section) => section.capacity - section.occupied))

const comparators: Record<SortKey, (a: OfferSubject, b: OfferSubject) => number> = {
  TERM: (a, b) => a.term - b.term || a.branch - b.branch,
  SEATS: (a, b) => freeSeats(b) - freeSeats(a) || a.term - b.term,
  NAME: (a, b) => a.name.localeCompare(b.name, 'es'),
}

// True when the keyboard focus is inside a field where `/` must be typed as text.
const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

const TOAST_MS = 4500
const UNDO_MS = 5000

const statusLabels: Record<string, string> = {
  PRE_ENROLLED: 'Pre-inscrita',
  PENDING: 'Pago pendiente',
  CONFIRMED: 'Confirmada',
}

export function PreEnrollmentCatalog({ offer }: { offer: Offer }) {
  const [view, setView] = useState<View>('AVAILABLE')
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('TERM')
  const searchRef = useRef<HTMLInputElement>(null)
  const [detail, setDetail] = useState<OfferSubject | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const selected = offer.enrollment?.sections ?? []
  const isLocked = Boolean(offer.enrollment && offer.enrollment.status !== 'PRE_ENROLLED')
  const selectedBySubject = useMemo(() => new Map(selected.map((section) => [section.subject.id, section])), [selected])
  const totalCredits = selected.reduce((sum, section) => sum + section.subject.credits, 0)

  useEffect(() => {
    if (!toast) return
    const timeout = setTimeout(() => setToast(null), toast.undoSectionId ? UNDO_MS : TOAST_MS)
    return () => clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return
      event.preventDefault()
      searchRef.current?.focus()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const isEnrollable = (subject: OfferSubject) => subject.status === 'AVAILABLE' && subject.sections.length > 0
  const availableCount = offer.subjects.filter(isEnrollable).length
  const needle = query.trim().toLowerCase()
  const visible = offer.subjects
    .filter(
      (subject) =>
        (view === 'AVAILABLE' ? isEnrollable(subject) : !isEnrollable(subject)) &&
        (!needle || subject.name.toLowerCase().includes(needle) || subject.code.toLowerCase().includes(needle)),
    )
    .sort(comparators[sortKey])

  const run = async (sectionId: string, action: (id: string) => Promise<ActionResult>) => {
    setPendingId(sectionId)
    try {
      setToast(await action(sectionId))
    } finally {
      setPendingId(null)
    }
  }

  const removeWithUndo = async (sectionId: string) => {
    setPendingId(sectionId)
    try {
      const result = await removeSection(sectionId)
      setToast(result.ok ? { ...result, undoSectionId: sectionId } : result)
    } finally {
      setPendingId(null)
    }
  }

  const undoRemoval = (sectionId: string) => {
    setToast(null)
    run(sectionId, addSection)
  }

  // First selected section of another subject whose schedule overlaps the candidate, with the overlapping blocks.
  const findClash = (candidate: SectionView) => {
    for (const other of selected) {
      if (other.subject.id === candidate.subject.id) continue
      const overlapping = other.blocks.filter((block) => candidate.blocks.some((own) => blocksOverlap(block, own)))
      if (overlapping.length) return { subjectName: other.subject.name, schedule: formatSchedule(overlapping) }
    }
    return null
  }

  const renderSection = (section: SectionView, subject: OfferSubject) => {
    const isSelected = selectedBySubject.get(subject.id)?.id === section.id
    const otherSection = isSelected ? undefined : selectedBySubject.get(subject.id)
    const isFull = section.occupied >= section.capacity
    const clash = isSelected ? null : findClash(section)
    const disabledReason = isSelected
      ? null
      : isLocked
        ? 'Tu inscripción ya no admite cambios.'
        : otherSection
          ? `Ya tienes la sección ${otherSection.number} de esta materia. Quítala para elegir esta.`
          : isFull
            ? 'Sin cupos disponibles en esta sección.'
            : clash
              ? `Choca con ${clash.subjectName} (${clash.schedule}).`
              : null
    return (
      <li
        key={section.id}
        className={cn(
          'rounded-2xl border p-3 transition',
          isSelected ? 'border-[var(--brand-orange)] bg-[var(--status-available-bg)]' : 'border-transparent bg-muted',
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Sección {section.number}</p>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[0.72rem] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <UserRound className="h-3.5 w-3.5" /> {section.professor}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" /> {formatSchedule(section.blocks)}
              </span>
              <span className={cn('inline-flex items-center gap-1', isFull && 'font-bold text-red-500')}>
                <UsersRound className="h-3.5 w-3.5" /> {section.capacity - section.occupied} cupos
              </span>
            </div>
          </div>
          {isSelected ? (
            <button
              type="button"
              className="secondary-button group !px-3.5 !py-2 text-xs hover:border-red-500/40 hover:text-red-600 focus:border-red-500/40 focus:text-red-600"
              disabled={isLocked || pendingId === section.id}
              onClick={() => removeWithUndo(section.id)}
              aria-label={`Quitar ${subject.name}`}
            >
              {pendingId === section.id ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <>
                  <span className="inline-flex items-center gap-1.5 group-hover:hidden group-focus:hidden">
                    <CheckCircle2 className="text-[var(--status-passed)]" /> Agregada
                  </span>
                  <span className="hidden items-center gap-1.5 group-hover:inline-flex group-focus:inline-flex">
                    <X /> Quitar
                  </span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              className="primary-button !px-3.5 !py-2 text-xs"
              disabled={Boolean(disabledReason) || pendingId === section.id}
              onClick={() => run(section.id, addSection)}
              aria-describedby={disabledReason ? `reason-${section.id}` : undefined}
            >
              {pendingId === section.id ? <LoaderCircle className="animate-spin" /> : <Plus />}
              {isFull ? 'Sin cupos' : 'Agregar'}
            </button>
          )}
        </div>
        {disabledReason && (
          <p
            id={`reason-${section.id}`}
            className={cn(
              'mt-2 flex items-start gap-1.5 text-[0.72rem] font-semibold leading-snug',
              clash && !otherSection && !isFull && !isLocked ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground',
            )}
          >
            <Info className="mt-px h-3.5 w-3.5 shrink-0" /> {disabledReason}
          </p>
        )}
      </li>
    )
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
      <div className="min-w-0">
        <div className="reveal reveal-1 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="search-box">
            <Search />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setQuery('')
              }}
              placeholder="Buscar por código o nombre… (tecla /)"
              aria-label="Buscar materias"
              aria-keyshortcuts="/"
            />
          </div>
          <label className="pill shrink-0 self-start !py-2 text-muted-foreground">
            Ordenar por
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              className="cursor-pointer bg-transparent font-bold text-foreground outline-none"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="segmented self-start" role="group" aria-label="Filtrar materias">
            <button type="button" aria-pressed={view === 'AVAILABLE'} onClick={() => setView('AVAILABLE')}>
              Disponibles ({availableCount})
            </button>
            <button type="button" aria-pressed={view === 'UNAVAILABLE'} onClick={() => setView('UNAVAILABLE')}>
              No disponibles
            </button>
          </div>
        </div>

        {visible.length ? (
          <div className="grid gap-4 2xl:grid-cols-2">
            {visible.map((subject, index) => {
              const missing = subject.requirements
                .filter((requirement) => !requirement.met && !requirement.isAlternative)
                .map((requirement) => requirement.label)
              const alternative = subject.requirements.find((requirement) => requirement.isAlternative)
              return (
                <article
                  key={subject.id}
                  className={cn('stat-card reveal flex flex-col !p-5', selectedBySubject.has(subject.id) && 'ring-2 ring-[var(--brand-orange)]')}
                  style={{ animationDelay: `${Math.min(index, 8) * 0.04}s` }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--brand-orange)]">{subject.code}</span>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[0.66rem] font-bold text-muted-foreground">
                      Trim. {toRoman(subject.term)} · {subject.credits} UC
                    </span>
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <h3 className="font-display text-xl font-bold uppercase leading-tight">{subject.name}</h3>
                    <button
                      type="button"
                      className="inline-flex shrink-0 items-center gap-0.5 pt-1 text-xs font-bold text-[#003087] dark:text-[#8fb8ff]"
                      onClick={() => setDetail(subject)}
                    >
                      Prelaciones <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {isEnrollable(subject) ? (
                    <ul className="mt-4 flex flex-col gap-2">{subject.sections.map((section) => renderSection(section, subject))}</ul>
                  ) : (
                    <div className="mt-4 flex items-start justify-between gap-3 rounded-2xl bg-muted p-3">
                      <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
                        <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {subject.status === 'BLOCKED'
                          ? `Te falta: ${missing.join(', ')}${alternative ? ` (o ${alternative.label})` : ''}`
                          : `Sin secciones en el período ${offer.term.name}.`}
                      </p>
                      <StatusBadge status={subject.status} />
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        ) : (
          <div className="surface p-10 text-center">
            <p className="font-bold">No hay materias que coincidan.</p>
            <p className="mt-1 text-sm text-muted-foreground">Prueba con otro término de búsqueda o cambia el filtro.</p>
          </div>
        )}
      </div>

      <aside className="surface reveal reveal-2 h-fit p-5 xl:sticky xl:top-24">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="stat-icon bg-[#f68629]/15 text-[var(--brand-orange)]">
              <ShoppingBag />
            </span>
            <div>
              <p className="font-bold">Tu selección</p>
              <p className="text-xs text-muted-foreground">Período {offer.term.name}</p>
            </div>
          </div>
          {offer.enrollment && <span className="pill !py-1 text-[0.66rem]">{statusLabels[offer.enrollment.status]}</span>}
        </div>

        {selected.length ? (
          <ul className="mt-5 flex flex-col gap-2">
            {selected.map((section) => (
              <li key={section.id} className="flex items-center gap-3 rounded-2xl bg-muted p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{section.subject.name}</p>
                  <p className="text-[0.68rem] text-muted-foreground">
                    Secc. {section.number} · {formatSchedule(section.blocks)}
                  </p>
                </div>
                {!isLocked && (
                  <button
                    type="button"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-red-500/10 hover:text-red-500"
                    onClick={() => removeWithUndo(section.id)}
                    disabled={pendingId === section.id}
                    aria-label={`Quitar ${section.subject.name}`}
                  >
                    {pendingId === section.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Aún no has agregado secciones.
          </p>
        )}

        <div className="mt-5 border-t border-border pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Unidades de crédito</span>
            <strong>
              {totalCredits} / {offer.term.maxCredits} UC
            </strong>
          </div>
          <div className="progress-track orange mt-2">
            <span style={{ width: `${Math.min(100, (totalCredits / offer.term.maxCredits) * 100)}%` }} />
          </div>
          <div className="mt-4 flex items-end justify-between">
            <span className="text-sm text-muted-foreground">
              Monto
              <small className="block text-[0.68rem]">{formatCurrency(offer.term.ratePerCredit)} por UC</small>
            </span>
            <strong className="font-display text-3xl font-extrabold">{formatCurrency(offer.enrollment?.amount ?? 0)}</strong>
          </div>
        </div>

        <button type="button" className="primary-button mt-5 w-full" disabled title="Disponible próximamente">
          <CreditCard /> Continuar al pago
        </button>
        <p className="mt-2 text-center text-[0.68rem] text-muted-foreground">El pago simulado estará disponible próximamente.</p>
      </aside>

      {detail && <SubjectDrawer subject={detail} onClose={() => setDetail(null)} showEnrollLink={false} />}

      {toast && (
        <div
          role="status"
          className="reveal fixed bottom-5 left-1/2 z-[70] flex w-[min(calc(100%-2rem),26rem)] -translate-x-1/2 items-center gap-3 rounded-[1.25rem] border border-border bg-card p-4 shadow-[var(--shadow-lift)]"
        >
          {toast.ok ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--status-passed)]" />
          ) : (
            <XCircle className="h-5 w-5 shrink-0 text-red-500" />
          )}
          <p className="flex-1 text-sm font-semibold">{toast.message}</p>
          {toast.undoSectionId && (
            <button
              type="button"
              className="secondary-button shrink-0 !px-3 !py-1.5 text-xs"
              onClick={() => undoRemoval(toast.undoSectionId!)}
            >
              <RotateCcw /> Deshacer
            </button>
          )}
        </div>
      )}
    </div>
  )
}
