import Link from 'next/link'
import { ArrowLeft, CalendarX2 } from 'lucide-react'
import { getEnrollmentSummary } from '@/control/controllers/enrollment-summary.controller'
import { GlossaryTerm } from '@/presentation/components/shared/glossary'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { formatCurrency, formatSchedule } from '@/presentation/lib/format'
import { ROUTES } from '@/presentation/lib/routes'
import { PayButton } from '@/presentation/portals/student/pre-enrollment/pay-button'

export default async function EnrollmentSummaryPage() {
  const summary = await getEnrollmentSummary()

  const backLink = (
    <Link href={ROUTES.studentPreEnrollment} className="secondary-button">
      <ArrowLeft /> Volver a la pre-inscripción
    </Link>
  )

  if (!summary) {
    return (
      <div className="content-container">
        <PageHeading eyebrow="Resumen" title="La inscripción no está abierta" actions={backLink} />
      </div>
    )
  }

  const { term, sections, totalCredits, amount, status } = summary
  const disabledReason = !sections.length
    ? 'Agrega al menos una sección a tu pre-inscripción para poder pagar.'
    : status === 'CONFIRMED'
      ? 'Tu inscripción ya está pagada y confirmada.'
      : null

  return (
    <div className="content-container">
      <PageHeading
        eyebrow={`Período ${term.name}`}
        title="Resumen de inscripción"
        description="Revisa tus materias, el total de UC y el monto antes de pagar. El monto se calcula en el servidor con la tarifa del período."
        actions={backLink}
      />

      <div className="section-grid grid xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="surface card-pad reveal reveal-1" aria-labelledby="summary-subjects">
          <h2 id="summary-subjects" className="text-lg font-bold">
            Materias
          </h2>
          {sections.length ? (
            <ul className="mt-4 flex flex-col gap-2">
              {sections.map((section) => (
                <li key={section.id} className="course-row" data-testid="summary-row">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{section.subject.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <span className="font-mono">{section.subject.code}</span> · Sección {section.number} · {section.professor}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatSchedule(section.blocks)}</p>
                  </div>
                  <p className="shrink-0 text-right">
                    <strong className="font-display text-xl font-extrabold tabular-nums">{section.subject.credits}</strong>
                    <span className="block text-[0.68rem] text-muted-foreground">UC</span>
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 flex items-center gap-3 rounded-[var(--card-radius-sm)] border border-dashed border-border p-5 text-sm text-muted-foreground">
              <CalendarX2 className="h-5 w-5 shrink-0" aria-hidden="true" /> Tu pre-inscripción está vacía.
            </div>
          )}
        </section>

        <aside className="surface card-pad reveal reveal-2 h-fit xl:sticky xl:top-24" aria-labelledby="summary-total">
          <h2 id="summary-total" className="text-lg font-bold">
            Total a pagar
          </h2>
          <dl className="mt-4 flex flex-col gap-2 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">
                Total de <GlossaryTerm entry="uc">UC</GlossaryTerm>
              </dt>
              <dd className="font-bold tabular-nums" data-testid="summary-credits">
                {totalCredits} / {term.maxCredits}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Tarifa por UC</dt>
              <dd className="font-bold tabular-nums">{formatCurrency(term.ratePerCredit)}</dd>
            </div>
            <div className="mt-2 flex items-end justify-between gap-3 border-t border-border pt-3">
              <dt className="font-semibold">Monto total</dt>
              <dd className="font-display text-3xl font-extrabold tabular-nums" data-testid="summary-amount">
                {formatCurrency(amount)}
              </dd>
            </div>
          </dl>
          <p className="mt-1 text-right text-[0.68rem] text-muted-foreground tabular-nums">
            {totalCredits} UC × {formatCurrency(term.ratePerCredit)}
          </p>
          <div className="mt-5">
            <PayButton disabledReason={disabledReason} />
          </div>
        </aside>
      </div>
    </div>
  )
}
