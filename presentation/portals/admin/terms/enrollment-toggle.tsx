'use client'

import { LoaderCircle, LockKeyhole, LockKeyholeOpen } from 'lucide-react'
import { closeEnrollment, openEnrollment } from '@/control/controllers/term.controller'
import { FormMessage } from '@/presentation/components/shared/form-message'
import { useAction } from '@/presentation/lib/use-action'

// Button that opens or closes enrollment for a period and shows the outcome, including why it was blocked.
export function EnrollmentToggle({ termId, open }: { termId: string; open: boolean }) {
  const { pending, result, run } = useAction()
  const Icon = pending ? LoaderCircle : open ? LockKeyhole : LockKeyholeOpen

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        className="secondary-button"
        disabled={pending}
        onClick={() => run(() => (open ? closeEnrollment(termId) : openEnrollment(termId)))}
      >
        <Icon className={pending ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} aria-hidden="true" />
        {open ? 'Cerrar inscripción' : 'Abrir inscripción'}
      </button>
      <FormMessage result={result} />
    </div>
  )
}
