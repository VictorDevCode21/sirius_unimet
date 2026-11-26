'use client'

import { useCallback, useState } from 'react'
import { CalendarDays, CheckCircle2, ChevronRight, Clock3, Landmark, ReceiptText, XCircle } from 'lucide-react'
import type { PaymentsOverview, TermStatement } from '@/control/controllers/payment.queries'
import { formatBolivares, formatCurrency, formatShortDate } from '@/presentation/lib/format'
import { accentOf, methodIcons } from '@/presentation/portals/student/payments/method-visuals'
import { PaymentDetailDialog } from '@/presentation/portals/student/payments/payment-detail-dialog'

type Payment = TermStatement['payments'][number]

// One enrolled term: amount, paid and balance tiles, payment progress and the history of payments, each with a
// button that opens its full detail.
export function TermStatementCard({ term, methods }: { term: TermStatement; methods: PaymentsOverview['methods'] }) {
  const [detail, setDetail] = useState<Payment | null>(null)
  const progress = term.amount > 0 ? Math.min(100, Math.round((term.paid / term.amount) * 100)) : 100
  const closeDetail = useCallback(() => setDetail(null), [])
  const methodLabel = (id: string) => methods.find((method) => method.id === id)?.label ?? id

  const tiles = [
    { label: 'Monto del período', value: formatCurrency(term.amount), tone: '' },
    { label: 'Pagado', value: formatCurrency(term.paid), tone: 'text-[var(--status-passed)]' },
    { label: 'Saldo pendiente', value: formatCurrency(term.balance), tone: term.settled ? '' : 'text-[var(--orange-text)]' },
  ]

  return (
    <article className="surface reveal overflow-hidden" aria-labelledby={`term-${term.termId}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-muted text-[var(--accent-text)]">
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 id={`term-${term.termId}`} className="font-display text-xl font-extrabold leading-tight">
              Período {term.termName}
            </h3>
            <p className="text-xs text-muted-foreground">
              {term.subjects} {term.subjects === 1 ? 'materia inscrita' : 'materias inscritas'}
              {term.enrolledAt && ` · inscrito el ${formatShortDate(new Date(term.enrolledAt))}`}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
            term.settled ? 'bg-[var(--status-passed-bg)] text-[var(--status-passed)]' : 'bg-[var(--status-available-bg)] text-[var(--orange-text)]'
          }`}
        >
          {term.settled ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />}
          {term.settled ? 'Pagado en su totalidad' : `Saldo pendiente ${formatCurrency(term.balance)}`}
        </span>
      </div>

      <div className="px-5 sm:px-6">
        <dl className="grid grid-cols-3 gap-2 sm:gap-3">
          {tiles.map((tile) => (
            <div key={tile.label} className="min-w-0 rounded-2xl border border-border bg-muted/60 p-3 sm:p-4">
              <dt className="text-[0.68rem] font-semibold leading-tight text-muted-foreground sm:text-xs">{tile.label}</dt>
              <dd className={`mt-1 font-display text-base font-extrabold leading-tight sm:text-2xl ${tile.tone}`}>{tile.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex items-center gap-3">
          <div className="progress-track flex-1" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Porcentaje pagado">
            <span style={{ width: `${progress}%` }} />
          </div>
          <span className="w-12 text-right text-xs font-bold tabular-nums">{progress}%</span>
        </div>
      </div>

      <div className="mt-5 border-t border-border p-5 sm:px-6">
        <h4 className="flex items-center gap-2 text-sm font-bold">
          <ReceiptText className="h-4 w-4 text-muted-foreground" aria-hidden="true" /> Historial de pagos
          <span className="rounded-full bg-muted px-2 py-0.5 text-[0.68rem] tabular-nums text-muted-foreground">{term.payments.length}</span>
        </h4>

        {term.payments.length ? (
          <ul className="mt-3 grid gap-2">
            {term.payments.map((payment) => {
              const Icon = methodIcons[payment.method] ?? Landmark
              const accent = accentOf(payment.method)
              const approved = payment.status === 'APPROVED'
              const bolivar = payment.currency === 'VES' && payment.paidAmount !== null
              return (
                <li
                  key={payment.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-3 rounded-2xl border border-border bg-card p-3 transition hover:border-[color-mix(in_oklab,var(--brand-sky)_45%,var(--border))] sm:grid-cols-[auto_minmax(0,1fr)_minmax(9rem,auto)_auto] sm:p-3.5"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: accent.color, color: accent.on }}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{methodLabel(payment.method)}</p>
                    <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      <span>{formatShortDate(new Date(payment.createdAt))}</span>
                      {payment.payerReference && <span className="font-mono">Ref. {payment.payerReference}</span>}
                      {!approved && (
                        <span className="inline-flex items-center gap-1 font-bold text-[var(--status-failed)]">
                          <XCircle className="h-3 w-3" aria-hidden="true" /> Rechazado
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="col-span-2 flex items-baseline justify-between gap-2 sm:col-span-1 sm:block sm:text-right">
                    <p className={`text-base font-extrabold ${approved ? 'text-[var(--status-passed)]' : 'text-muted-foreground line-through'}`}>
                      {bolivar ? formatBolivares(payment.paidAmount!) : formatCurrency(payment.amount)}
                    </p>
                    {bolivar && <p className="text-xs text-muted-foreground">≈ {formatCurrency(payment.amount)}</p>}
                  </div>
                  <button type="button" className="secondary-button col-span-2 w-full !py-2 text-xs sm:col-span-1 sm:w-auto" onClick={() => setDetail(payment)}>
                    Ver detalles <ChevronRight aria-hidden="true" />
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="mt-3 rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
            Aún no has registrado pagos para este período.
          </p>
        )}
      </div>

      {detail && <PaymentDetailDialog payment={detail} termName={term.termName} methodLabel={methodLabel(detail.method)} onClose={closeDetail} />}
    </article>
  )
}
