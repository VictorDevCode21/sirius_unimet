'use client'

import { useState } from 'react'
import { Power, Trash2 } from 'lucide-react'
import { deleteCareer, setCareerStatus } from '@/control/controllers/career.controller'
import type { CareerView } from '@/control/controllers/career.queries'
import { FormMessage } from '@/presentation/components/shared/form-message'
import { useAction } from '@/presentation/lib/use-action'

// Career row with its usage, delete and activation controls. A blocked delete offers deactivation instead.
export function CareerCard({ career }: { career: CareerView }) {
  const [offerDeactivate, setOfferDeactivate] = useState(false)
  const { pending, result, run } = useAction()

  const remove = async () => {
    if (!window.confirm(`¿Eliminar la carrera ${career.name}?`)) return
    const response = await run(() => deleteCareer(career.id))
    setOfferDeactivate(Boolean(response?.canDeactivate))
  }

  const toggleActive = async () => {
    setOfferDeactivate(false)
    await run(() => setCareerStatus(career.id, !career.active))
  }

  return (
    <li className="surface reveal flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-bold [overflow-wrap:anywhere]">{career.name}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {career.department} · {career.studentCount} estudiantes · {career.subjectCount} materias
          </p>
        </div>
        <span className="pill self-start">{career.active ? 'Activa' : 'Inactiva'}</span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {!offerDeactivate && (
          <button type="button" className="secondary-button" disabled={pending} onClick={toggleActive}>
            <Power className="h-4 w-4" aria-hidden="true" /> {career.active ? 'Desactivar' : 'Activar'}
          </button>
        )}
        <button type="button" className="secondary-button" disabled={pending} onClick={remove}>
          <Trash2 className="h-4 w-4" aria-hidden="true" /> Eliminar
        </button>
        {offerDeactivate && (
          <button type="button" className="primary-button" disabled={pending} onClick={toggleActive}>
            <Power className="h-4 w-4" aria-hidden="true" /> Desactivar en su lugar
          </button>
        )}
      </div>
      <FormMessage result={result} />
    </li>
  )
}
