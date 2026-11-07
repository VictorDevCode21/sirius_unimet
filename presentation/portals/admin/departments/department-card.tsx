'use client'

import { useState } from 'react'
import { LoaderCircle, UserRoundCheck } from 'lucide-react'
import { assignHead } from '@/control/controllers/department.controller'
import type { DepartmentView } from '@/control/controllers/department.queries'
import { FormMessage } from '@/presentation/components/shared/form-message'
import { useAction } from '@/presentation/lib/use-action'

// Department row with its current head and the control to change it.
export function DepartmentCard({ department }: { department: DepartmentView }) {
  const [headId, setHeadId] = useState(department.headId ?? '')
  const { pending, result, run } = useAction()

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    run(() => assignHead({ departmentId: department.id, headId }))
  }

  return (
    <li className="surface reveal flex flex-col gap-4 p-5">
      <div className="min-w-0">
        <p className="font-bold [overflow-wrap:anywhere]">{department.name}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {department.careerCount} {department.careerCount === 1 ? 'carrera' : 'carreras'} · Jefe: {department.headName ?? 'sin asignar'}
        </p>
      </div>
      <form className="flex flex-col gap-3 sm:flex-row sm:items-center" onSubmit={submit}>
        <select
          className="field min-w-0 flex-1 cursor-pointer py-3 text-sm text-foreground"
          value={headId}
          onChange={(event) => setHeadId(event.target.value)}
          aria-label={`Jefe de ${department.name}`}
        >
          <option value="">Sin jefe</option>
          {department.candidates.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.name}
            </option>
          ))}
        </select>
        <button type="submit" className="secondary-button" disabled={pending}>
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserRoundCheck className="h-4 w-4" aria-hidden="true" />}
          Guardar jefe
        </button>
      </form>
      <FormMessage result={result} />
    </li>
  )
}
