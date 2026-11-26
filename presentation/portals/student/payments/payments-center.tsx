'use client'

import { useState } from 'react'
import { CheckCircle2, Landmark, TrendingUp, Wallet } from 'lucide-react'
import type { PaymentsOverview } from '@/control/controllers/payment.queries'
import { formatCurrency, formatRate } from '@/presentation/lib/format'
import { PaymentForm } from '@/presentation/portals/student/payments/payment-form'
import { TermStatementCard } from '@/presentation/portals/student/payments/term-statement'

// Account statement of the student: totals, BCV rate, the payment form for a term with balance and every term's
// payments.
export function PaymentsCenter({ overview }: { overview: PaymentsOverview }) {
  const { terms, totalDue, bcv, methods } = overview
  const owed = [...terms].filter((term) => !term.settled).sort((a, b) => new Date(a.termStartsAt).getTime() - new Date(b.termStartsAt).getTime())
  const [termId, setTermId] = useState(owed[0]?.termId ?? null)
  const selected = owed.find((term) => term.termId === termId) ?? owed[0] ?? null

  return (
    <div className="flex flex-col gap-5">
      <dl className="reveal reveal-1 grid gap-3 sm:grid-cols-3">
        <div className="stat-card">
          <dt className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Wallet className="h-4 w-4" aria-hidden="true" /> Saldo pendiente
          </dt>
          <dd className="mt-1 font-display text-3xl font-extrabold" data-testid="total-due">
            {formatCurrency(totalDue)}
          </dd>
        </div>
        <div className="stat-card">
          <dt className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <TrendingUp className="h-4 w-4" aria-hidden="true" /> Tasa oficial BCV
          </dt>
          <dd className="mt-1 font-display text-3xl font-extrabold">{bcv ? `Bs. ${formatRate(bcv.rate)}` : 'No disponible'}</dd>
          {bcv && (
            <p className="mt-1 text-xs text-muted-foreground">
              Por dólar{bcv.valueDate ? ` · fecha valor ${bcv.valueDate.split('-').reverse().join('/')}` : ''}
              {bcv.stale ? ' · última tasa leída, el BCV no respondió' : ''}
            </p>
          )}
        </div>
        <div className="stat-card">
          <dt className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Landmark className="h-4 w-4" aria-hidden="true" /> Períodos inscritos
          </dt>
          <dd className="mt-1 font-display text-3xl font-extrabold">{terms.length}</dd>
        </div>
      </dl>

      {selected ? (
        <PaymentForm
          key={selected.termId}
          term={selected}
          owedTerms={owed.map((term) => ({ termId: term.termId, termName: term.termName, balance: term.balance }))}
          onTermChange={setTermId}
          methods={methods}
          bcv={bcv}
        />
      ) : (
        <p role="status" className="surface card-pad reveal flex items-center gap-2 text-sm font-semibold text-[var(--status-passed)]">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {terms.length ? 'No tienes saldos pendientes. Todos tus períodos inscritos están pagados.' : 'Aún no tienes períodos inscritos que pagar.'}
        </p>
      )}

      <section aria-labelledby="statements-title" className="flex flex-col gap-3">
        <h2 id="statements-title" className="text-lg font-bold">
          Períodos inscritos
        </h2>
        {terms.map((term) => (
          <TermStatementCard key={term.termId} term={term} methods={methods} />
        ))}
      </section>
    </div>
  )
}
