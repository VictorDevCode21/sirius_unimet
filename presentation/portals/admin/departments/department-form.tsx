'use client'

import { useState } from 'react'
import { Building2, LoaderCircle, Plus } from 'lucide-react'
import { createDepartment } from '@/control/controllers/department.controller'
import { FormMessage } from '@/presentation/components/shared/form-message'
import { useAction } from '@/presentation/lib/use-action'

// Form to create a department.
export function DepartmentForm() {
  const [name, setName] = useState('')
  const { pending, result, run } = useAction()

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const response = await run(() => createDepartment(name))
    if (response?.ok) setName('')
  }

  return (
    <form className="surface card-pad reveal reveal-1 mb-5 grid gap-4" onSubmit={submit} noValidate>
      <label className="flex min-w-0 flex-col gap-1.5 text-sm font-bold">
        Nombre del departamento
        <span className="field">
          <Building2 aria-hidden="true" />
          <input
            className="min-w-0 flex-1 border-0 bg-transparent py-3.5 text-[0.95rem] text-foreground outline-0"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </span>
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="primary-button" disabled={pending}>
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Crear departamento
        </button>
        <FormMessage result={result} />
      </div>
    </form>
  )
}
