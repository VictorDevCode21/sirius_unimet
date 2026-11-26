'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Bitcoin, CircleDollarSign, Landmark, LoaderCircle, MessageSquareText, Send } from 'lucide-react'
import { registerPayment, requestDebitOtp } from '@/control/controllers/payment.controller'
import type { PaymentsOverview, TermStatement } from '@/control/controllers/payment.queries'
import { FormMessage } from '@/presentation/components/shared/form-message'
import { formatBolivares, formatCurrency, formatRate } from '@/presentation/lib/format'
import { cn } from '@/presentation/lib/utils'
import { useAction } from '@/presentation/lib/use-action'

type Method = PaymentsOverview['methods'][number]

const inputClass = 'min-w-0 flex-1 border-0 bg-transparent py-3.5 text-[0.95rem] text-foreground outline-0'

const foreignIcons: Record<string, typeof Landmark> = { ZELLE: CircleDollarSign, BINANCE_PAY: Bitcoin, US_BANK_TRANSFER: Landmark }

interface PaymentFormProps {
  term: TermStatement
  owedTerms: { termId: string; termName: string; balance: number }[]
  onTermChange: (termId: string) => void
  methods: Method[]
  bcv: PaymentsOverview['bcv']
}

// Payment of a term with balance: choose a method, see where to send the money, report the payment data.
export function PaymentForm({ term, owedTerms, onTermChange, methods, bcv }: PaymentFormProps) {
  const router = useRouter()
  const [methodId, setMethodId] = useState<string>(methods[0].id)
  const [amount, setAmount] = useState(term.balance.toFixed(2).replace('.', ','))
  const [fields, setFields] = useState<Record<string, string>>({})
  const [otp, setOtp] = useState<{ token: string; sms: string; message: string } | null>(null)
  const { pending, result, run } = useAction()
  const debit = useAction()

  const method = methods.find((item) => item.id === methodId)!
  const bolivar = method.currency === 'VES'
  const amountNumber = Number(amount.replace(',', '.'))
  const bolivarAmount = bcv && Number.isFinite(amountNumber) ? Math.round(amountNumber * bcv.rate * 100) / 100 : null
  const unavailable = bolivar && !bcv

  const chooseMethod = (id: string) => {
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
    const response = await run(() => registerPayment({ termId: term.termId, method: method.id, amount, fields, otpToken: otp?.token }))
    if (response?.ok) {
      setFields({})
      setOtp(null)
      router.refresh()
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
          <Image src="/brands/mercantil.svg" alt="Mercantil" width={92} height={22} className="h-5 w-auto" />
        </legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {methods
            .filter((item) => item.currency === 'VES')
            .map((item) => (
              <MethodOption key={item.id} method={item} selected={item.id === methodId} onSelect={chooseMethod}>
                <Image src="/brands/mercantil.svg" alt="" width={70} height={17} className="h-4 w-auto" />
              </MethodOption>
            ))}
        </div>
      </fieldset>
      <fieldset className="grid gap-3">
        <legend className="mb-2 text-sm font-bold">Divisas</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {methods
            .filter((item) => item.currency !== 'VES')
            .map((item) => {
              const Icon = foreignIcons[item.id] ?? Landmark
              return (
                <MethodOption key={item.id} method={item} selected={item.id === methodId} onSelect={chooseMethod}>
                  <Icon className="h-4 w-4 text-[var(--accent-text)]" aria-hidden="true" />
                </MethodOption>
              )
            })}
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
            <p className="flex justify-between gap-2">
              <span className="text-muted-foreground">Monto</span>
              <strong>{Number.isFinite(amountNumber) ? formatCurrency(amountNumber) : '—'}</strong>
            </p>
            {bolivar && (
              <p className="mt-1 flex justify-between gap-2" data-testid="bolivar-amount">
                <span className="text-muted-foreground">{bcv ? `A pagar en bolívares (tasa ${formatRate(bcv.rate)})` : 'Tasa BCV no disponible'}</span>
                <strong>{bolivarAmount !== null ? formatBolivares(bolivarAmount) : '—'}</strong>
              </p>
            )}
            {method.currency === 'USDT' && <p className="mt-1 text-xs text-muted-foreground">Se acepta USDT 1:1 con el dólar.</p>}
          </div>
          <p className="mt-3 text-[0.7rem] text-muted-foreground">Cuentas simuladas para el proyecto: no se realiza ningún cobro real.</p>
        </div>

        <div className="grid content-start gap-3 sm:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-1.5 text-sm font-bold sm:col-span-2">
            Monto a abonar (USD)
            <span className="field">
              <CircleDollarSign aria-hidden="true" />
              <input className={inputClass} inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} required />
            </span>
            <small className="text-xs font-normal text-muted-foreground">Puedes pagar el saldo completo o un abono parcial.</small>
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
        <FormMessage result={result} />
      </div>
    </form>
  )
}

function MethodOption({ method, selected, onSelect, children }: { method: Method; selected: boolean; onSelect: (id: string) => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(method.id)}
      className={cn(
        'flex items-center justify-between gap-2 rounded-2xl border-[1.5px] px-4 py-3 text-left text-sm font-bold transition',
        selected ? 'border-[var(--brand-orange)] bg-[var(--status-available-bg)]' : 'border-border bg-card hover:border-[var(--brand-sky)]',
      )}
    >
      <span>{method.label}</span>
      {children}
    </button>
  )
}
