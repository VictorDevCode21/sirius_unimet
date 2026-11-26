import { CheckCircle2, XCircle } from 'lucide-react'
import type { ActionResult } from '@/control/controllers/action-result'
import { cn } from '@/presentation/lib/utils'

// Success or error feedback of a server action, announced to assistive technologies.
export function FormMessage({ result }: { result: ActionResult | null }) {
  if (!result) return null
  const Icon = result.ok ? CheckCircle2 : XCircle
  return (
    <p
      role={result.ok ? 'status' : 'alert'}
      className={cn('flex items-start gap-2 text-sm font-semibold', result.ok ? 'text-[var(--status-passed)]' : 'text-red-600 dark:text-red-400')}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0">{result.message}</span>
    </p>
  )
}
