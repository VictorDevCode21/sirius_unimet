'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Clock3, CreditCard, FileText, LoaderCircle, XCircle } from 'lucide-react'
import { simulatePayment, type PaymentActionResult } from '@/control/controllers/payment.controller'
import type { PaymentSummary } from '@/control/controllers/payment.queries'
import { formatCurrency, formatSchedule, formatShortDate } from '@/presentation/lib/format'

type Outcome = 'APPROVED'

const enrollmentStatus = {
  PRE_ENROLLED: { label: 'Pendiente de pago', icon: Clock3, className: 'bg-[var(--status-progress-bg)] text-[var(--status-progress)]' },
  PENDING: { label: 'Pago rechazado · pendiente', icon: XCircle, className: 'bg-[var(--status-available-bg)] text-[var(--status-available)]' },
  CONFIRMED: { label: 'Pagada y confirmada', icon: CheckCircle2, className: 'bg-[var(--status-passed-bg)] text-[var(--status-passed)]' },
} as const

const paymentStatus = {
  APPROVED: { label: 'Aprobado', icon: CheckCircle2, className: 'text-[var(--status-passed)]' },
  REJECTED: { label: 'Rechazado', icon: XCircle, className: 'text-red-700 dark:text-red-300' },
} as const

// Summary of the pre-enrollment and simulated payment buttons; payment state comes from the server.
export function PaymentSimulator({ summary }: { summary: PaymentSummary }) {
  const router = useRouter()
  const [pending, setPending] = useState<Outcome | null>(null)
  const [result, setResult] = useState<PaymentActionResult | null>(null)
  // The same attempt id is reused if a request fails before the server answers, so a retry cannot pay twice.
  const attemptRef = useRef<string | null>(null)
  const status = summary.status ? enrollmentStatus[summary.status] : null
  const StatusIcon = status?.icon
  const confirmed = summary.status === 'CONFIRMED'
  const payable = summary.status === 'PRE_ENROLLED' && summary.sections.length > 0

  const pay = async (outcome: Outcome) => {
    if (pending) return
    setPending(outcome)
    setResult(null)
    attemptRef.current ??= crypto.randomUUID()
    try {
      const response = await simulatePayment({ outcome, attemptId: attemptRef.current })
      attemptRef.current = null
      setResult(response)
      router.refresh()
    } catch {
      setResult({ ok: false, message: 'No se pudo contactar al servidor. Vuelve a intentarlo: el intento no se cobrará dos veces.' })
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="section-grid grid xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
      <section className="surface card-pad reveal reveal-1" aria-labelledby="payment-summary-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="payment-summary-title" className="text-lg font-bold">
            Resumen de tu pre-inscripción
          </h2>
          {status && StatusIcon && (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${status.className}`}>
              <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" /> {status.label}
            </span>
          )}
        </div>

        {summary.sections.length ? (
          <ul className="mt-5 flex flex-col gap-2">
            {summary.sections.map((section) => (
              <li key={section.id} className="flex items-center gap-3 rounded-2xl bg-muted p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{section.subject.name}</p>
                  <p className="text-[0.7rem] text-muted-foreground">
                    {section.subject.code} · Secc. {section.number} · {formatSchedule(section.blocks) || 'Sin horario'}
                  </p>
                </div>
                <strong className="text-sm">{section.subject.credits} UC</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No tienes secciones pre-inscritas en este período.{' '}
            <Link href="/student/pre-enrollment" className="font-bold text-[var(--accent-text)] underline-offset-2 hover:underline">
              Ir a Pre-inscripción
            </Link>
          </p>
        )}

        <div className="mt-5 flex items-end justify-between border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">
            {summary.totalCredits} UC × {formatCurrency(summary.term.ratePerCredit)}
          </span>
          <strong className="font-display text-3xl font-extrabold">{formatCurrency(summary.amount)}</strong>
        </div>

        {summary.payments.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-bold">Intentos de pago</h3>
            <ul className="mt-2 flex flex-col gap-1.5 text-xs">
              {summary.payments.map((payment) => {
                const info = paymentStatus[payment.status]
                const Icon = info.icon
                return (
                  <li key={payment.reference} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted px-3 py-2">
                    <span className="font-mono">{payment.reference}</span>
                    <span className="text-muted-foreground">{formatShortDate(payment.createdAt)}</span>
                    <span className={`inline-flex items-center gap-1 font-bold ${info.className}`}>
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {info.label} · {formatCurrency(payment.amount)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </section>

      <aside className="surface card-pad reveal reveal-2 h-fit" aria-labelledby="simulator-title">
        <span className="stat-icon bg-[#f68629]/15 text-[var(--orange-text)]">
          <CreditCard aria-hidden="true" />
        </span>
        <h2 id="simulator-title" className="mt-4 text-lg font-bold">
          Simulador de pago
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Elige el resultado del pago ficticio. Al aprobarse, tu inscripción queda confirmada y puedes descargar el comprobante.
        </p>

        {confirmed ? (
          <Link href={`/student/receipt?term=${encodeURIComponent(summary.term.name)}`} className="primary-button mt-5 w-full">
            <FileText aria-hidden="true" /> Ver comprobante
          </Link>
        ) : (
          <div className="mt-5 flex flex-col gap-2">
            <button type="button" className="primary-button w-full" onClick={() => pay('APPROVED')} disabled={!payable || pending !== null}>
              {pending === 'APPROVED' ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
              {pending === 'APPROVED' ? 'Procesando…' : `Simular pago aprobado · ${formatCurrency(summary.amount)}`}
            </button>
          </div>
        )}

        <div className="mt-4" aria-live="polite">
          {result && (
            <p
              role={result.ok ? 'status' : 'alert'}
              className={`flex items-start gap-2 rounded-2xl p-4 text-sm font-semibold ${result.ok ? 'bg-[var(--status-passed-bg)] text-[var(--status-passed)]' : 'bg-red-500/10 text-red-700 dark:text-red-300'}`}
            >
              {result.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
              <span>
                {result.message}
                {result.reference && <span className="mt-1 block font-mono text-xs font-normal">Referencia {result.reference}</span>}
              </span>
            </p>
          )}
        </div>
      </aside>
    </div>
  )
}
