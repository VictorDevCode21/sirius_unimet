'use client'

import { Check, PartyPopper } from 'lucide-react'
import type { PaymentReceipt } from '@/control/controllers/payment.controller'
import { useModal } from '@/presentation/lib/use-modal'
import { formatBolivares, formatCaracasDateTime, formatCurrency, formatRate } from '@/presentation/lib/format'

// Confirmation of a registered payment. Closing it (button, backdrop or Escape) hands control back to the page,
// which resets the payment form with the updated balance.
export function PaymentSuccessDialog({ receipt, onClose }: { receipt: PaymentReceipt; onClose: () => void }) {
  const doneButton = useModal<HTMLButtonElement>(onClose)

  const rows: { label: string; value: string; mono?: boolean }[] = [
    { label: 'Período', value: receipt.termName },
    { label: 'Método de pago', value: receipt.methodLabel },
    ...(receipt.currency === 'VES' && receipt.exchangeRate
      ? [
          { label: 'Equivalente abonado', value: formatCurrency(receipt.amount) },
          { label: 'Tasa BCV aplicada', value: `Bs. ${formatRate(receipt.exchangeRate)}` },
        ]
      : []),
    ...(receipt.payerReference ? [{ label: 'Referencia del pago', value: receipt.payerReference, mono: true }] : []),
    ...(receipt.authorization ? [{ label: 'Código de autorización', value: receipt.authorization, mono: true }] : []),
    { label: 'Comprobante', value: receipt.reference, mono: true },
    { label: 'Fecha de registro', value: formatCaracasDateTime(new Date(receipt.registeredAt)) },
  ]

  return (
    <div className="success-backdrop" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-success-title"
        aria-describedby="payment-success-text"
        className="success-dialog"
        onClick={(event) => event.stopPropagation()}
        data-testid="payment-success"
      >
        <div className="success-hero">
          <span className="success-check" aria-hidden="true">
            <Check strokeWidth={3.25} />
          </span>
          <h2 id="payment-success-title" className="mt-5 font-display text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">
            ¡Pago registrado con éxito!
          </h2>
          <p id="payment-success-text" className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Hemos recibido tu pago correctamente. El monto ya fue abonado a tu estado de cuenta.
          </p>
          <p className="mt-5 font-display text-4xl font-extrabold text-[var(--orange-text)] sm:text-5xl" data-testid="payment-success-amount">
            {receipt.currency === 'VES'
              ? formatBolivares(receipt.paidAmount)
              : receipt.currency === 'USDT'
                ? `USDT ${receipt.amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : formatCurrency(receipt.amount)}
          </p>
        </div>

        <dl className="mx-5 grid gap-2.5 rounded-2xl bg-muted p-4 text-sm sm:mx-7">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className={row.mono ? 'font-mono text-xs font-bold' : 'font-semibold'}>{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mx-5 mt-3 sm:mx-7">
          {receipt.settled ? (
            <p className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--status-passed-bg)] p-3 text-center text-sm font-bold text-[var(--status-passed)]">
              <PartyPopper className="h-4 w-4 shrink-0" aria-hidden="true" />
              El período {receipt.termName} quedó pagado en su totalidad.
            </p>
          ) : (
            <p className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border p-3 text-sm">
              <span className="text-muted-foreground">Saldo pendiente del período</span>
              <strong>{formatCurrency(receipt.balance)}</strong>
            </p>
          )}
        </div>

        <div className="p-5 sm:px-7 sm:pb-7">
          <button ref={doneButton} type="button" className="primary-button w-full" onClick={onClose}>
            Listo
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">Puedes consultar este pago en tu estado de cuenta, más abajo en esta página.</p>
        </div>
      </div>
    </div>
  )
}
