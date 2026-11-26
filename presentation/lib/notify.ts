import toast from 'react-hot-toast'

export const UNEXPECTED_ERROR = 'Ocurrió un error inesperado. Intenta de nuevo en unos segundos.'

// Shows an error to the user. The message is also the toast id, so repeating the same failure does not stack copies.
export function notifyError(message: string | null | undefined) {
  const text = message?.trim() || UNEXPECTED_ERROR
  toast.error(text, { id: text })
}

// Error of several validation messages at once, one per line.
export function notifyErrors(messages: string[]) {
  if (messages.length) notifyError(messages.join('\n'))
}

// Redirects and not-found signals thrown by Next.js inside server actions must keep propagating.
export function isNavigationSignal(error: unknown) {
  const digest = (error as { digest?: unknown } | null)?.digest
  return typeof digest === 'string' && (digest.startsWith('NEXT_REDIRECT') || digest.startsWith('NEXT_HTTP_ERROR_FALLBACK') || digest === 'NEXT_NOT_FOUND')
}

// Runs a server action and shows an error toast when it is rejected ({ ok: false }) or fails unexpectedly (for
// example, a lost connection). Returns the result, or null when the action threw.
export async function runWithErrorToast<T extends { ok: boolean; message: string }>(action: () => Promise<T>): Promise<T | null> {
  try {
    const result = await action()
    if (!result.ok) notifyError(result.message)
    return result
  } catch (error) {
    if (isNavigationSignal(error)) throw error
    console.error(error)
    notifyError(UNEXPECTED_ERROR)
    return null
  }
}
