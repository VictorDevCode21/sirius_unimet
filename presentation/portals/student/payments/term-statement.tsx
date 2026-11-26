import { CheckCircle2, Clock3 } from 'lucide-react'
import type { PaymentsOverview, TermStatement } from '@/control/controllers/payment.queries'
import { formatBolivares, formatCurrency, formatRate, formatShortDate } from '@/presentation/lib/format'

// One enrolled term: amount, what has been paid, the balance and every payment made.
export function TermStatementCard({ term, methods }: { term: TermStatement; methods: PaymentsOverview['methods'] }) {
  const progress = term.amount > 0 ? Math.min(100, Math.round((term.paid / term.amount) * 100)) : 100
  const methodLabel = (id: string) => methods.find((method) => method.id === id)?.label ?? id

  return (
    <article className="surface card-pad reveal" aria-labelledby={`term-${term.termId}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id={`term-${term.termId}`} className="font-display text-xl font-extrabold">
            Período {term.termName}
          </h3>
          <p className="text-xs text-muted-foreground">
            {term.subjects} {term.subjects === 1 ? 'materia inscrita' : 'materias inscritas'}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
            term.settled ? 'bg-[var(--status-passed-bg)] text-[var(--status-passed)]' : 'bg-[var(--status-available-bg)] text-[var(--status-available)]'
          }`}
        >
          {term.settled ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />}
          {term.settled ? 'Pagado' : `Debe ${formatCurrency(term.balance)}`}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Monto</dt>
          <dd className="font-bold">{formatCurrency(term.amount)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Pagado</dt>
          <dd className="font-bold">{formatCurrency(term.paid)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Saldo</dt>
          <dd className="font-bold">{formatCurrency(term.balance)}</dd>
        </div>
      </dl>
      <div className="progress-track mt-3" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      {term.payments.length > 0 && (
        <ul className="mt-4 flex flex-col gap-1.5 text-xs">
          {term.payments.map((payment) => (
            <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted px-3 py-2">
              <span className="font-semibold">{methodLabel(payment.method)}</span>
              <span className="font-mono">{payment.payerReference ?? payment.details.authorization ?? payment.reference}</span>
              <span className="text-muted-foreground">{formatShortDate(new Date(payment.createdAt))}</span>
              <span className={payment.status === 'APPROVED' ? 'font-bold text-[var(--status-passed)]' : 'font-bold text-red-700 dark:text-red-300'}>
                {payment.status === 'APPROVED' ? '' : 'Rechazado · '}
                {formatCurrency(payment.amount)}
                {payment.currency === 'VES' && payment.paidAmount !== null && payment.exchangeRate !== null
                  ? ` · ${formatBolivares(payment.paidAmount)} a ${formatRate(payment.exchangeRate)}`
                  : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
