'use client'

import { useState } from 'react'
import { LoaderCircle, Save } from 'lucide-react'
import type { ActionResult } from '@/control/controllers/action-result'
import { FormMessage } from '@/presentation/components/shared/form-message'
import { useAction } from '@/presentation/lib/use-action'

interface TermSettingFormProps {
  title: string
  description: string
  label: string
  initialValue: string
  inputMode: 'decimal' | 'numeric'
  save: (value: string) => Promise<ActionResult>
}

// Single-value form used for the settings of a period. The value travels as text so the server validates it.
export function TermSettingForm({ title, description, label, initialValue, inputMode, save }: TermSettingFormProps) {
  const [value, setValue] = useState(initialValue)
  const { pending, result, run } = useAction()

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    run(() => save(value))
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
          <input
            className="min-w-0 flex-1 border-0 bg-transparent py-3.5 text-[0.95rem] text-foreground outline-0"
            inputMode={inputMode}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </span>
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="primary-button" disabled={pending}>
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar
        </button>
        <FormMessage result={result} />
      </div>
    </form>
  )
}
