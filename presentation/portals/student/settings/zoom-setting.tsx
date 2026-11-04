'use client'

import { useEffect, useId, useState } from 'react'
import { CheckCircle2, RotateCcw, ZoomIn } from 'lucide-react'
import {
  DEFAULT_UI_ZOOM,
  UI_ZOOM_OPTIONS,
  applyUiZoom,
  readStoredUiZoom,
  storeUiZoom,
  type UiZoom,
} from '@/presentation/lib/ui-zoom'
import { cn } from '@/presentation/lib/utils'

const NOTICE_MS = 2500

// Accessibility section with the interface zoom radio group; changes apply instantly and persist locally.
export function ZoomSetting() {
  const [zoom, setZoom] = useState<UiZoom>(DEFAULT_UI_ZOOM)
  const [notice, setNotice] = useState<string | null>(null)
  const name = useId()

  useEffect(() => setZoom(readStoredUiZoom()), [])

  useEffect(() => {
    if (!notice) return
    const timeout = setTimeout(() => setNotice(null), NOTICE_MS)
    return () => clearTimeout(timeout)
  }, [notice])

  const changeZoom = (next: UiZoom) => {
    setZoom(next)
    applyUiZoom(next)
    storeUiZoom(next)
    setNotice(`Zoom actualizado al ${next} %`)
  }

  return (
    <section className="surface reveal reveal-2 p-5 sm:p-6" aria-labelledby="accessibility-title">
      <h2 id="accessibility-title" className="text-lg font-bold">
        Accesibilidad
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Ajusta el tamaño de textos, íconos y tarjetas de todo el portal.</p>

      <fieldset className="mt-5">
        <legend className="flex items-center gap-2 text-sm font-bold">
          <ZoomIn className="h-4 w-4" aria-hidden="true" /> Zoom
        </legend>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="segmented flex-wrap">
            {UI_ZOOM_OPTIONS.map((option) => (
              <label key={option} className="relative">
                <input
                  type="radio"
                  name={name}
                  value={option}
                  checked={zoom === option}
                  onChange={() => changeZoom(option)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    'block cursor-pointer rounded-full px-4 py-2 text-sm font-bold text-muted-foreground transition',
                    'peer-checked:bg-[var(--brand-blue)] peer-checked:text-white dark:peer-checked:bg-[var(--brand-sky)]',
                    'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--ring)]',
                  )}
                >
                  {option} %
                </span>
              </label>
            ))}
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => changeZoom(DEFAULT_UI_ZOOM)}
            disabled={zoom === DEFAULT_UI_ZOOM}
          >
            <RotateCcw /> Restablecer
          </button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          El valor predeterminado es {DEFAULT_UI_ZOOM} %. La preferencia se guarda en este navegador.
        </p>
      </fieldset>

      <p role="status" aria-live="polite" className="sr-only">
        {notice}
      </p>
      {notice && (
        <div
          aria-hidden="true"
          className="reveal fixed bottom-5 left-1/2 z-[70] flex w-[min(calc(100%-2rem),22rem)] -translate-x-1/2 items-center gap-3 rounded-[1.25rem] border border-border bg-card p-4 shadow-[var(--shadow-lift)]"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--status-passed)]" />
          <p className="text-sm font-semibold">{notice}</p>
        </div>
      )}
    </section>
  )
}
