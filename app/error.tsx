'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RotateCcw, TriangleAlert } from 'lucide-react'
import { notifyError } from '@/presentation/lib/notify'

// Error boundary of every route: announces the failure with an error toast and offers to retry the page.
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
    notifyError('No pudimos cargar esta página. Intenta de nuevo en unos segundos.')
  }, [error])

  return (
    <div className="flex min-h-[70dvh] items-center justify-center p-6">
      <div className="surface card-pad reveal w-full max-w-md text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-red-500/12 text-[var(--status-failed)]">
          <TriangleAlert className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="page-title mt-6">Algo salió mal</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Ocurrió un error al cargar esta página. Puedes intentarlo de nuevo; si el problema continúa, comunícate con Control de Estudios.
        </p>
        {error.digest && <p className="mt-2 font-mono text-[0.68rem] text-muted-foreground">Código: {error.digest}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" className="primary-button" onClick={reset}>
            <RotateCcw aria-hidden="true" /> Intentar de nuevo
          </button>
          <Link href="/" className="secondary-button">
            Volver a mi portal
          </Link>
        </div>
      </div>
    </div>
  )
}
