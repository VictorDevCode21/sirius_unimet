'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CreditCard, LoaderCircle } from 'lucide-react'
import { validateSeats, type SeatValidationResult } from '@/control/controllers/enrollment.controller'
import { ROUTES } from '@/presentation/lib/routes'

interface PayButtonProps {
  disabledReason: string | null
}

// "Pagar" action of the summary: checks the seats of the selection on the server and then opens the payment page.
export function PayButton({ disabledReason }: PayButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<SeatValidationResult | null>(null)

  const pay = () =>
    startTransition(async () => {
      const validation = await validateSeats()
      setResult(validation)
      if (validation.ok) router.push(ROUTES.studentPayment)
    })

  return (
    <div>
      <button
        type="button"
        className="primary-button w-full"
        disabled={Boolean(disabledReason) || isPending}
        aria-describedby={disabledReason ? 'pay-disabled-reason' : undefined}
        onClick={pay}
      >
        {isPending ? <LoaderCircle className="animate-spin" /> : <CreditCard />} Pagar
      </button>
      {disabledReason && (
        <p id="pay-disabled-reason" className="mt-2 text-center text-xs text-muted-foreground">
          {disabledReason}
        </p>
      )}
      {result && !result.ok && (
        <div role="alert" className="mt-4 rounded-[var(--card-radius-sm)] border border-red-500/30 bg-red-500/8 p-3 text-sm">
          <p className="flex items-start gap-2 font-semibold text-red-700 dark:text-red-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {result.message}
          </p>
          <Link href={ROUTES.studentPreEnrollment} className="mt-2 inline-block text-xs font-bold text-[#003087] dark:text-[#8fb8ff]">
            Ajustar mi pre-inscripción →
          </Link>
        </div>
      )}
    </div>
  )
}
