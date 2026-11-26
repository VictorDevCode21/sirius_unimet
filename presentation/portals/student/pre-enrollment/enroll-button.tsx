'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ListChecks, LoaderCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { validateSeats } from '@/control/controllers/enrollment.controller'
import { ERROR_TOAST_ARIA, isNavigationSignal, notifyError } from '@/presentation/lib/notify'
import { ROUTES } from '@/presentation/lib/routes'

interface EnrollButtonProps {
  disabledReason: string | null
}

// "Inscribir" action of the summary: checks the seats of the selection on the server and then opens the enrollment
// page, where the student enrolls at their turn.
export function EnrollButton({ disabledReason }: EnrollButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const goToEnrollment = () =>
    startTransition(async () => {
      let validation
      try {
        validation = await validateSeats()
      } catch (error) {
        if (isNavigationSignal(error)) throw error
        return notifyError(null)
      }
      if (validation.ok) return router.push(ROUTES.studentEnrollment)
      toast.error(
        (item) => (
          <span>
            {validation.message}{' '}
            <Link href={ROUTES.studentPreEnrollment} className="font-bold text-[var(--accent-text)] underline" onClick={() => toast.dismiss(item.id)}>
              Ajustar mi pre-inscripción
            </Link>
          </span>
        ),
        { id: 'seat-validation', ariaProps: ERROR_TOAST_ARIA },
      )
    })

  return (
    <div>
      <button
        type="button"
        className="primary-button w-full"
        disabled={Boolean(disabledReason) || isPending}
        aria-describedby={disabledReason ? 'enroll-disabled-reason' : undefined}
        onClick={goToEnrollment}
      >
        {isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <ListChecks aria-hidden="true" />} Inscribir
      </button>
      {disabledReason && (
        <p id="enroll-disabled-reason" className="mt-2 text-center text-xs text-muted-foreground">
          {disabledReason}
        </p>
      )}
    </div>
  )
}
