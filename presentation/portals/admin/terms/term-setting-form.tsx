'use client'

import { useState } from 'react'
import { LoaderCircle, Save } from 'lucide-react'
import type { ActionResult } from '@/control/controllers/action-result'
import { FormMessage } from '@/presentation/components/shared/form-message'
import { MoneyInput } from '@/presentation/components/shared/money-input'
import { centsToDecimal, toCents } from '@/presentation/lib/money-entry'
import { useAction } from '@/presentation/lib/use-action'

interface TermSettingFormProps {
  title: string
  description: string
  label: string
  initialValue: string
  inputMode: 'decimal' | 'numeric'
  type?: 'text' | 'date'
  save: (value: string) => Promise<ActionResult>
}

const fieldClass = 'min-w-0 flex-1 border-0 bg-transparent py-3.5 text-[0.95rem] text-foreground outline-0'

// Single-value form used for the settings of a period. The value travels as text so the server validates it; decimal
// values are amounts typed bank-style, with two fixed decimals.
export function TermSettingForm({ title, description, label, initialValue, inputMode, type = 'text', save }: TermSettingFormProps) {
  const money = inputMode === 'decimal'
  const [value, setValue] = useState(initialValue)
  const [cents, setCents] = useState(() => toCents(Number(initialValue) || 0))
  const { pending, result, run } = useAction()

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    run(() => save(money ? centsToDecimal(cents) : value))
  }

  return (
    <form className="surface card-pad reveal grid gap-4" onSubmit={submit} noValidate>
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <label className="flex min-w-0 flex-col gap-1.5 text-sm font-bold">
        {label}
        <span className="field">
          {money ? (
            <MoneyInput className={fieldClass} cents={cents} onCentsChange={setCents} />
          ) : (
            <input className={fieldClass} type={type} inputMode={inputMode} value={value} onChange={(event) => setValue(event.target.value)} />
          )}
        </span>
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="primary-button" disabled={pending}>
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          Guardar
        </button>
        <FormMessage result={result} />
      </div>
    </form>
  )
}
