'use client'

import { useState } from 'react'
import { CalendarDays, Hash, LoaderCircle, Plus } from 'lucide-react'
import { createTerm } from '@/control/controllers/term.controller'
import { FormMessage } from '@/presentation/components/shared/form-message'
import { useAction } from '@/presentation/lib/use-action'

const inputClass = 'min-w-0 flex-1 border-0 bg-transparent py-3.5 text-[0.95rem] text-foreground outline-0'
const emptyForm = { name: '', startsAt: '', endsAt: '' }

// Form to create an academic period with a name, start date and end date.
export function TermForm() {
  const [form, setForm] = useState(emptyForm)
  const { pending, result, run } = useAction()

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const response = await run(() => createTerm(form))
    if (response?.ok) setForm(emptyForm)
  }

  const update = (field: keyof typeof emptyForm) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [field]: event.target.value }))

  return (
    <form className="surface card-pad reveal reveal-1 mb-5 grid gap-4" onSubmit={submit} noValidate>
      <h2 className="text-lg font-bold">Crear periodo</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex min-w-0 flex-col gap-1.5 text-sm font-bold">
          Nombre
          <span className="field">
            <Hash aria-hidden="true" />
            <input className={inputClass} value={form.name} onChange={update('name')} placeholder="2627-1" required />
          </span>
        </label>
        <label className="flex min-w-0 flex-col gap-1.5 text-sm font-bold">
          Fecha de inicio
          <span className="field">
            <CalendarDays aria-hidden="true" />
            <input className={inputClass} type="date" value={form.startsAt} onChange={update('startsAt')} required />
          </span>
        </label>
        <label className="flex min-w-0 flex-col gap-1.5 text-sm font-bold">
          Fecha de fin
          <span className="field">
            <CalendarDays aria-hidden="true" />
            <input className={inputClass} type="date" value={form.endsAt} onChange={update('endsAt')} required />
          </span>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="primary-button" disabled={pending}>
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Crear periodo
        </button>
        <FormMessage result={result} />
      </div>
    </form>
  )
}
