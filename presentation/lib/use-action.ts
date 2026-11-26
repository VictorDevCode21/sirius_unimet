'use client'

import { useState } from 'react'
import type { ActionResult } from '@/control/controllers/action-result'
import { runWithErrorToast, UNEXPECTED_ERROR } from '@/presentation/lib/notify'

// Tracks the pending state and last result of a server action triggered from a form or button. Every failure, a
// rejected result or an exception such as a lost connection, is shown with an error toast.
export function useAction() {
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<ActionResult | null>(null)

  const run = async <T extends ActionResult>(action: () => Promise<T>) => {
    if (pending) return null
    setPending(true)
    setResult(null)
    try {
      const response = await runWithErrorToast(action)
      setResult(response ?? { ok: false, message: UNEXPECTED_ERROR })
      return response
    } finally {
      setPending(false)
    }
  }

  return { pending, result, run }
}
