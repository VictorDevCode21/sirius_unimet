import { CheckCircle2 } from 'lucide-react'
import type { ActionResult } from '@/control/controllers/action-result'

// Success feedback of a server action, announced to assistive technologies. Failures are shown as error toasts by
// useAction, so they are not repeated here.
export function FormMessage({ result }: { result: ActionResult | null }) {
  if (!result?.ok) return null
  return (
    <p role="status" className="flex items-start gap-2 text-sm font-semibold text-[var(--status-passed)]">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0">{result.message}</span>
    </p>
  )
}
