'use client'

import { CheckCircle2, Landmark, X, XCircle } from 'lucide-react'
import type { TermStatement } from '@/control/controllers/payment.queries'
import { formatBolivares, formatCaracasDateTime, formatCurrency, formatRate } from '@/presentation/lib/format'
import { useModal } from '@/presentation/lib/use-modal'
import { accentOf, methodIcons } from '@/presentation/portals/student/payments/method-visuals'

type Payment = TermStatement['payments'][number]

// Labels of the payer data stored with each payment (sensitive values are already masked when stored).
const detailLabels: Record<string, string> = {
  bank: 'Banco emisor',
  bankName: 'Banco',
  phone: 'Teléfono',
  idNumber: 'Cédula o RIF',
  holderName: 'Titular',
  cardHolder: 'Titular de la tarjeta',
  card: 'Tarjeta',
  zelleContact: 'Contacto Zelle',
  payerId: 'Pay ID o correo Binance',
  account: 'Cuenta',
  transferType: 'Tipo de transferencia',
  date: 'Fecha indicada por el pagador',
  authorization: 'Código de autorización',
}

const formatPayerDate = (value: string) => (/^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-').reverse().join('/') : value)

// Full detail of one payment of the history: amounts, BCV conversion for bolívar payments, references and payer data.
export function PaymentDetailDialog({ payment, termName, methodLabel, onClose }: { payment: Payment; termName: string; methodLabel: string; onClose: () => void }) {
  const closeButton = useModal<HTMLButtonElement>(onClose)
  const Icon = methodIcons[payment.method] ?? Landmark
  const accent = accentOf(payment.method)
  const approved = payment.status === 'APPROVED'
  const bolivar = payment.currency === 'VES' && payment.paidAmount !== null && payment.exchangeRate !== null

  const amounts: { label: string; value: string }[] = bolivar
    ? [
        { label: 'Monto pagado', value: formatBolivares(payment.paidAmount!) },
        { label: 'Tasa BCV del día del pago', value: `Bs. ${formatRate(payment.exchangeRate!)} por dólar` },
        { label: 'Equivalente abonado', value: formatCurrency(payment.amount) },
      ]
    : [
        {
          label: 'Monto pagado',
          value:
            payment.currency === 'USDT'
              ? `USDT ${payment.amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : formatCurrency(payment.amount),
        },
        { label: 'Abonado a la cuenta', value: formatCurrency(payment.amount) },
      ]

  const references: { label: string; value: string; mono?: boolean }[] = [
    { label: 'Fecha y hora de registro', value: formatCaracasDateTime(new Date(payment.createdAt)) },
    ...(payment.payerReference ? [{ label: 'Referencia del pago', value: payment.payerReference, mono: true }] : []),
    { label: 'Comprobante', value: payment.reference, mono: true },
  ]
  const payer = Object.entries(payment.details)
    .filter(([key, value]) => value && detailLabels[key])
    .map(([key, value]) => ({ label: detailLabels[key], value: key === 'date' ? formatPayerDate(value) : value, mono: key === 'authorization' }))

  return (
    <div className="success-backdrop" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-detail-title"
        className="success-dialog"
        style={{ '--method-accent': accent.color } as React.CSSProperties}
        onClick={(event) => event.stopPropagation()}
        data-testid="payment-detail"
      >
        <div className="payment-detail-hero">
          <button ref={closeButton} type="button" className="icon-button absolute right-4 top-4" onClick={onClose} aria-label="Cerrar detalle del pago">
            <X aria-hidden="true" />
          </button>
          <span className="grid h-14 w-14 place-items-center rounded-2xl shadow-lg" style={{ background: accent.color, color: accent.on }}>
            <Icon className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {methodLabel} · Período {termName}
          </p>
          <h2 id="payment-detail-title" className="mt-1 font-display text-4xl font-extrabold">
            {bolivar ? formatBolivares(payment.paidAmount!) : amounts[0].value}
          </h2>
          <span
            className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              approved ? 'bg-[var(--status-passed-bg)] text-[var(--status-passed)]' : 'bg-[var(--status-failed-bg)] text-[var(--status-failed)]'
            }`}
          >
            {approved ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <XCircle className="h-3.5 w-3.5" aria-hidden="true" />}
            {approved ? 'Pago aprobado' : 'Pago rechazado'}
          </span>
        </div>

        <div className="grid gap-3 px-5 pb-6 sm:px-7">
          <DetailGroup title="Montos" rows={amounts} />
          <DetailGroup title="Registro" rows={references} />
          {payer.length > 0 && <DetailGroup title="Datos del pagador" rows={payer} />}
          <p className="text-center text-[0.7rem] text-muted-foreground">Pago registrado en el simulador del sistema; no corresponde a un cobro real.</p>
        </div>
      </div>
    </div>
  )
}

function DetailGroup({ title, rows }: { title: string; rows: { label: string; value: string; mono?: boolean }[] }) {
  return (
    <section className="rounded-2xl bg-muted p-4">
      <h3 className="text-[0.68rem] font-bold uppercase tracking-widest text-muted-foreground">{title}</h3>
      <dl className="mt-2.5 grid gap-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className={row.mono ? 'font-mono text-xs font-bold' : 'text-right font-semibold'}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
