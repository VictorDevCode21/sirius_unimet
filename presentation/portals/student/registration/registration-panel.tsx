'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, CreditCard, FileText, ListChecks, LoaderCircle, XCircle } from 'lucide-react'
import { enroll } from '@/control/controllers/registration.controller'
import type { Registration } from '@/control/controllers/registration.queries'
import { FormMessage } from '@/presentation/components/shared/form-message'
import { formatCaracasDateTime, formatCurrency, formatSchedule } from '@/presentation/lib/format'
import { ROUTES } from '@/presentation/lib/routes'
import { useAction } from '@/presentation/lib/use-action'

// Pre-enrolled sections, all chosen by default (except full ones), and the "Inscribir" action of the student's turn.
export function RegistrationPanel({ registration }: { registration: Registration }) {
  const router = useRouter()
  const { sections, status, turn, hold, term } = registration
  const enrolled = status === 'CONFIRMED'
  const [chosen, setChosen] = useState(() => new Set(sections.filter((section) => !section.full).map((section) => section.id)))
  const { pending, result, run } = useAction()

  const chosenSections = sections.filter((section) => chosen.has(section.id))
  const credits = chosenSections.reduce((sum, section) => sum + section.subject.credits, 0)
  const amount = Math.round(credits * term.ratePerCredit * 100) / 100

  const blockedReason = enrolled
    ? null
    : !sections.length
      ? 'No tienes materias pre-inscritas en este período.'
      : hold.length
        ? 'Tienes un bloqueo financiero.'
        : turn.state === 'NOT_SCHEDULED'
          ? 'La inscripción de este período todavía no tiene fecha.'
          : turn.state === 'UPCOMING'
            ? `Podrás inscribir desde el ${formatCaracasDateTime(turn.turnAt!)}.`
            : turn.state === 'CLOSED'
              ? 'La inscripción de este período ya cerró.'
              : !chosen.size
                ? 'Elige al menos una materia.'
                : null

  const toggle = (id: string) =>
    setChosen((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const submit = async () => {
    const response = await run(() => enroll({ sectionIds: [...chosen] }))
    if (response?.ok) router.refresh()
  }

  return (
    <section className="surface card-pad reveal reveal-1" aria-labelledby="registration-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="registration-title" className="text-lg font-bold">
          {enrolled ? 'Materias inscritas' : 'Materias pre-inscritas'}
        </h2>
        {enrolled && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--status-passed-bg)] px-3 py-1.5 text-xs font-bold text-[var(--status-passed)]">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Inscrito
          </span>
        )}
      </div>

      {sections.length ? (
        <ul className="mt-5 flex flex-col gap-2" data-testid="registration-sections">
          {sections.map((section) => {
            const checked = enrolled || chosen.has(section.id)
            return (
              <li key={section.id}>
                <label
                  className={`flex items-center gap-3 rounded-2xl bg-muted p-3 ${enrolled || section.full ? '' : 'cursor-pointer'} ${section.full && !enrolled ? 'opacity-70' : ''}`}
                >
                  {!enrolled && (
                    <input
                      type="checkbox"
                      className="h-4 w-4 shrink-0 accent-[var(--brand-blue)]"
                      checked={checked}
                      disabled={section.full}
                      onChange={() => toggle(section.id)}
                      aria-label={`Inscribir ${section.subject.name}`}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="[overflow-wrap:anywhere] text-sm font-semibold">{section.subject.name}</p>
                    <p className="text-[0.7rem] text-muted-foreground">
                      {section.subject.code} · Secc. {section.number} · {section.professor} · {formatSchedule(section.blocks) || 'Sin horario'}
                    </p>
                  </div>
                  <div className="text-right">
                    <strong className="block text-sm">{section.subject.credits} UC</strong>
                    {!enrolled &&
                      (section.full ? (
                        <span className="inline-flex items-center gap-1 text-[0.68rem] font-bold text-[var(--status-failed)]">
                          <XCircle className="h-3 w-3" aria-hidden="true" /> Sin cupo
                        </span>
                      ) : (
                        <span className="text-[0.68rem] text-muted-foreground">
                          {section.seatsLeft} {section.seatsLeft === 1 ? 'cupo' : 'cupos'}
                        </span>
                      ))}
                  </div>
                </label>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="mt-5 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No tienes materias pre-inscritas.{' '}
          <Link href={ROUTES.studentPreEnrollment} className="font-bold text-[var(--accent-text)]">
            Ir a Pre-inscripción
          </Link>
        </p>
      )}

      {sections.some((section) => section.full) && !enrolled && (
        <p className="mt-3 text-xs text-muted-foreground">
          Una sección sin cupo no se puede inscribir. Puedes cambiarla por otra en{' '}
          <Link href={ROUTES.studentPreEnrollment} className="font-bold text-[var(--accent-text)]">
            Pre-inscripción
          </Link>
          .
        </p>
      )}

      <div className="mt-5 flex items-end justify-between border-t border-border pt-4">
        <span className="text-sm text-muted-foreground">
          {enrolled ? registration.totalCredits : credits} UC × {formatCurrency(term.ratePerCredit)}
        </span>
        <strong className="font-display text-3xl font-extrabold" data-testid="registration-amount">
          {formatCurrency(enrolled ? registration.amount : amount)}
        </strong>
      </div>

      {enrolled ? (
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Link href={ROUTES.studentReceipt} className="secondary-button w-full">
            <FileText aria-hidden="true" /> Ver certificado
          </Link>
          <Link href={ROUTES.studentPayments} className="primary-button w-full">
            <CreditCard aria-hidden="true" /> Ir a Pagos
          </Link>
        </div>
      ) : (
        <div className="mt-5">
          <button type="button" className="primary-button w-full" onClick={submit} disabled={Boolean(blockedReason) || pending}>
            {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <ListChecks aria-hidden="true" />}
            {pending ? 'Inscribiendo…' : chosen.size ? `Inscribir ${chosen.size} ${chosen.size === 1 ? 'materia' : 'materias'}` : 'Inscribir'}
          </button>
          {blockedReason && <p className="mt-2 text-center text-xs text-muted-foreground">{blockedReason}</p>}
          <p className="mt-2 text-center text-xs text-muted-foreground">Inscribir no cobra: pagas después, en uno o varios abonos.</p>
        </div>
      )}
      <FormMessage result={result} />
    </section>
  )
}
