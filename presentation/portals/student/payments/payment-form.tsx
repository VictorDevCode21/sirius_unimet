'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Check, CircleDollarSign, Landmark, LoaderCircle, MessageSquareText, Send } from 'lucide-react'
import { registerPayment, requestDebitOtp, type PaymentReceipt } from '@/control/controllers/payment.controller'
import type { PaymentsOverview, TermStatement } from '@/control/controllers/payment.queries'
import { FormMessage } from '@/presentation/components/shared/form-message'
import { MoneyInput } from '@/presentation/components/shared/money-input'
import { formatBolivares, formatCurrency, formatRate } from '@/presentation/lib/format'
import { centsToDecimal, formatCents, toCents } from '@/presentation/lib/money-entry'
import { cn } from '@/presentation/lib/utils'
import { useAction } from '@/presentation/lib/use-action'
import { accentOf, currencyTags, methodIcons } from '@/presentation/portals/student/payments/method-visuals'

type Method = PaymentsOverview['methods'][number]

const inputClass = 'min-w-0 flex-1 border-0 bg-transparent py-3.5 text-[0.95rem] text-foreground outline-0'


interface PaymentFormProps {
  term: TermStatement
  owedTerms: { termId: string; termName: string; balance: number }[]
  onTermChange: (termId: string) => void
  methods: Method[]
  bcv: PaymentsOverview['bcv']
  onPaid: (receipt: PaymentReceipt) => void
}

// Payment of a term with balance: choose a method, see where to send the money, report the payment data.
export function PaymentForm({ term, owedTerms, onTermChange, methods, bcv, onPaid }: PaymentFormProps) {
  const router = useRouter()
  const [methodId, setMethodId] = useState<string>(methods[0].id)
  // Balance of the term in the currency of a method: bolívars at the BCV rate, dollars (or USDT 1:1) as they are.
  const balanceIn = (currency: string) => (currency === 'VES' ? (bcv ? Math.round(term.balance * bcv.rate * 100) / 100 : 0) : term.balance)
  const [amountCents, setAmountCents] = useState(() => toCents(balanceIn(methods[0].currency)))
  const [fields, setFields] = useState<Record<string, string>>({})
  const [otp, setOtp] = useState<{ token: string; sms: string; message: string } | null>(null)
  const { pending, result, run } = useAction()
  const debit = useAction()

  const method = methods.find((item) => item.id === methodId)!
  const bolivar = method.currency === 'VES'
  const amountNumber = amountCents / 100
  const dollarEquivalent = bolivar && bcv ? Math.round((amountNumber / bcv.rate) * 100) / 100 : null
  const unavailable = bolivar && !bcv
  const formatIn = (currency: string, value: number) =>
    currency === 'VES' ? formatBolivares(value) : currency === 'USDT' ? `USDT ${formatCents(toCents(value))}` : formatCurrency(value)

  const chooseMethod = (id: string) => {
    const next = methods.find((item) => item.id === id)!
    if (next.currency !== method.currency) setAmountCents(toCents(balanceIn(next.currency)))
    setMethodId(id)
    setFields({})
    setOtp(null)
  }
  const setField = (name: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFields((current) => ({ ...current, [name]: event.target.value }))

  const askOtp = async () => {
    const response = await debit.run(() => requestDebitOtp({ termId: term.termId, fields }))
    if (response?.ok && 'otpToken' in response) setOtp({ token: response.otpToken!, sms: response.smsCode!, message: response.message })
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const response = await run(() => registerPayment({ termId: term.termId, method: method.id, amount: centsToDecimal(amountCents), fields, otpToken: otp?.token }))
    if (response?.ok && response.receipt) {
      router.refresh()
      onPaid(response.receipt)
    }
  }

  const visibleFields = method.fields.filter((field) => field.name !== 'otp' || otp)

  return (
    <form className="surface card-pad reveal reveal-2 grid gap-5" onSubmit={submit} noValidate aria-labelledby="payment-form-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="payment-form-title" className="text-lg font-bold">
            Registrar un pago
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Saldo del período {term.termName}: <strong className="text-foreground">{formatCurrency(term.balance)}</strong>
            {bolivar && bcv && <span> · {formatBolivares(balanceIn('VES'))} a la tasa BCV</span>}
          </p>
        </div>
        {owedTerms.length > 1 && (
          <label className="flex min-w-[12rem] flex-col gap-1.5 text-sm font-bold">
            Período a pagar
            <span className="field">
              <select className={inputClass} value={term.termId} onChange={(event) => onTermChange(event.target.value)}>
                {owedTerms.map((owed) => (
                  <option key={owed.termId} value={owed.termId}>
                    {owed.termName} · {formatCurrency(owed.balance)}
                  </option>
                ))}
              </select>
            </span>
          </label>
        )}
      </div>

      <fieldset className="grid gap-3">
        <legend className="mb-2 flex items-center gap-2 text-sm font-bold">
          Bolívares
          <span className="rounded-md bg-white px-2 py-0.5">
            <Image src="/brands/mercantil.svg" alt="Mercantil" width={92} height={22} className="h-4 w-auto" />
          </span>
        </legend>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {methods
            .filter((item) => item.currency === 'VES')
            .map((item) => (
              <MethodOption key={item.id} method={item} selected={item.id === methodId} onSelect={chooseMethod}>
                <span className="w-fit rounded-md bg-white px-1.5 py-0.5 dark:shadow-sm">
                  <Image src="/brands/mercantil.svg" alt="" width={70} height={17} className="h-3 w-auto" />
                </span>
              </MethodOption>
            ))}
        </div>
      </fieldset>
      <fieldset className="grid gap-3">
        <legend className="mb-2 text-sm font-bold">Divisas</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {methods
            .filter((item) => item.currency !== 'VES')
            .map((item) => (
              <MethodOption key={item.id} method={item} selected={item.id === methodId} onSelect={chooseMethod} />
            ))}
        </div>
      </fieldset>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-2xl bg-muted p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {method.id === 'IMMEDIATE_DEBIT' || method.id === 'ONLINE_CARD' ? 'Cobro' : 'Datos para pagar'} · {method.label}
          </p>
          <dl className="mt-3 grid gap-2 text-sm">
            {method.destination.map((item) => (
              <div key={item.label} className="flex flex-wrap justify-between gap-2">
                <dt className="text-muted-foreground">{item.label}</dt>
                <dd className="font-mono text-xs font-bold">{item.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 border-t border-border pt-3 text-sm">
            <p className="flex items-baseline justify-between gap-2">
              <span className="text-muted-foreground">Monto a pagar</span>
              <strong className="text-base" data-testid="amount-to-pay">
                {formatIn(method.currency, amountNumber)}
              </strong>
            </p>
            {bolivar && (
              <p className="mt-1 flex justify-between gap-2" data-testid="dollar-equivalent">
                <span className="text-muted-foreground">{bcv ? `Equivale a (tasa BCV ${formatRate(bcv.rate)})` : 'Tasa BCV no disponible'}</span>
                <strong>{dollarEquivalent !== null ? formatCurrency(dollarEquivalent) : '—'}</strong>
              </p>
            )}
            {method.currency === 'USDT' && <p className="mt-1 text-xs text-muted-foreground">Se acepta USDT 1:1 con el dólar.</p>}
          </div>
          <p className="mt-3 text-[0.7rem] text-muted-foreground">Cuentas simuladas para el proyecto: no se realiza ningún cobro real.</p>
        </div>

        <div className="grid content-start gap-3 sm:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-1.5 text-sm font-bold sm:col-span-2">
            Monto a abonar ({method.currency === 'VES' ? 'Bs.' : method.currency})
            <span className="field">
              {bolivar ? (
                <span aria-hidden="true" className="text-sm font-bold text-muted-foreground">
                  Bs.
                </span>
              ) : (
                <CircleDollarSign aria-hidden="true" />
              )}
              <MoneyInput className={inputClass} cents={amountCents} onCentsChange={setAmountCents} required />
            </span>
            <small className="text-xs font-normal text-muted-foreground">
              {bolivar
                ? 'Escribe el monto en bolívares. Se abona su equivalente en dólares a la tasa BCV del momento del registro.'
                : `Escribe el monto en ${method.currency === 'USDT' ? 'USDT' : 'dólares'}. Puedes pagar el saldo completo o un abono parcial.`}
            </small>
          </label>
          {visibleFields.map((field) => (
            <label key={field.name} className="flex min-w-0 flex-col gap-1.5 text-sm font-bold">
              {field.label}
              <span className="field">
                {field.type === 'select' ? (
                  <select className={inputClass} value={fields[field.name] ?? ''} onChange={setField(field.name)}>
                    <option value="">Elige una opción</option>
                    {field.options!.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className={inputClass}
                    type={field.type ?? 'text'}
                    inputMode={field.inputMode}
                    placeholder={field.placeholder}
                    value={fields[field.name] ?? ''}
                    onChange={setField(field.name)}
                    autoComplete="off"
                  />
                )}
              </span>
              {field.hint && <small className="text-xs font-normal text-muted-foreground">{field.hint}</small>}
            </label>
          ))}
          {method.id === 'IMMEDIATE_DEBIT' && (
            <div className="sm:col-span-2">
              <button type="button" className="secondary-button" onClick={askOtp} disabled={debit.pending}>
                {debit.pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <MessageSquareText aria-hidden="true" />}
                {otp ? 'Enviar otra clave' : 'Solicitar clave de débito'}
              </button>
              {otp && (
                <p role="status" className="mt-3 rounded-2xl border border-border bg-card p-3 text-sm">
                  <span className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">SMS simulado · Mercantil</span>
                  {otp.message} Tu clave es <strong className="font-mono text-base">{otp.sms}</strong>.
                </p>
              )}
              {!otp && <FormMessage result={debit.result} />}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" className="primary-button" disabled={pending || unavailable || (method.id === 'IMMEDIATE_DEBIT' && !otp)}>
          {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
          {pending ? 'Registrando…' : 'Registrar pago'}
        </button>
        <FormMessage result={result?.ok ? null : result} />
      </div>
    </form>
  )
}

// Selectable payment method card: icon tile, currency tag, name and an optional brand mark, highlighted in the method's brand color.
function MethodOption({ method, selected, onSelect, children }: { method: Method; selected: boolean; onSelect: (id: string) => void; children?: React.ReactNode }) {
  const Icon = methodIcons[method.id] ?? Landmark
  const accent = accentOf(method.id)
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(method.id)}
      style={{ '--method-accent': accent.color, '--method-on-accent': accent.on } as React.CSSProperties}
      className={cn(
        'group relative flex min-h-[8.5rem] flex-col justify-between gap-4 overflow-hidden rounded-3xl border-[1.5px] p-4 text-left transition duration-200',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--method-accent)]',
        selected
          ? 'border-[var(--method-accent)] bg-[color-mix(in_oklab,var(--method-accent)_9%,var(--card))] shadow-[0_10px_28px_-16px_var(--method-accent)]'
          : 'border-border bg-card hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--method-accent)_55%,var(--border))]',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[var(--method-accent)] blur-2xl transition-opacity',
          selected ? 'opacity-15' : 'opacity-0 group-hover:opacity-10',
        )}
      />
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'grid h-11 w-11 place-items-center rounded-2xl transition-colors',
            selected
              ? 'bg-[var(--method-accent)] text-[var(--method-on-accent)]'
              : 'bg-muted text-[var(--accent-text)] group-hover:text-[var(--method-accent)] dark:group-hover:text-foreground',
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        {selected ? (
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--method-accent)] text-[var(--method-on-accent)]">
            <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
          </span>
        ) : (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-bold tracking-wide text-muted-foreground">
            {currencyTags[method.currency] ?? method.currency}
          </span>
        )}
      </div>
      <div className="relative grid gap-1.5">
        <span className="text-sm font-bold leading-tight">{method.label}</span>
        {children}
      </div>
    </button>
  )
}
