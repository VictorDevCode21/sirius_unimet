'use client'

import { useState } from 'react'
import type { ActionResult } from '@/control/controllers/action-result'

// Tracks the pending state and last result of a server action triggered from a form or button.
export function useAction() {
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<ActionResult | null>(null)

  const run = async <T extends ActionResult>(action: () => Promise<T>) => {
    if (pending) return null
    setPending(true)
    setResult(null)
    try {
      const response = await action()
      setResult(response)
      return response
    } finally {
      setPending(false)
    }
  }

  return { pending, result, run }
}
