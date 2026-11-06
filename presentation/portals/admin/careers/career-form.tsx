'use client'

import { useState } from 'react'
import { Building2, GraduationCap, LoaderCircle, Plus } from 'lucide-react'
import { createCareer } from '@/control/controllers/career.controller'
import type { DepartmentOption } from '@/control/controllers/career.queries'
import { FormMessage } from '@/presentation/components/shared/form-message'
import { useAction } from '@/presentation/lib/use-action'

const inputClass = 'min-w-0 flex-1 border-0 bg-transparent py-3.5 text-[0.95rem] text-foreground outline-0'

// Form to create a career in a department.
export function CareerForm({ departments }: { departments: DepartmentOption[] }) {
  const [name, setName] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const { pending, result, run } = useAction()

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const response = await run(() => createCareer({ name, departmentId }))
    if (response?.ok) setName('')
  }

  return (
    <form className="surface card-pad reveal reveal-1 mb-5 grid gap-4" onSubmit={submit} noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex min-w-0 flex-col gap-1.5 text-sm font-bold">
          Nombre de la carrera
          <span className="field">
            <GraduationCap aria-hidden="true" />
            <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} required />
          </span>
        </label>
        <label className="flex min-w-0 flex-col gap-1.5 text-sm font-bold">
          Departamento
          <span className="field">
            <Building2 aria-hidden="true" />
            <select className={`${inputClass} cursor-pointer`} value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} required>
              <option value="">Elige un departamento</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </span>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="primary-button" disabled={pending}>
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Crear carrera
        </button>
        <FormMessage result={result} />
      </div>
    </form>
  )
}
