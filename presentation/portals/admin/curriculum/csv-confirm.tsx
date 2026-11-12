'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, LoaderCircle } from 'lucide-react'
import { confirmCurriculumImport, type CurriculumPreview } from '@/control/controllers/curriculum.controller'
import { FormMessage } from '@/presentation/components/shared/form-message'
import type { UploadedCsv } from '@/presentation/portals/admin/curriculum/csv-upload'
import { useAction } from '@/presentation/lib/use-action'

interface CsvConfirmProps {
  file: UploadedCsv
  preview: CurriculumPreview
}

// Final step of the import: states what will be replaced and saves the file once the admin confirms it.
export function CsvConfirm({ file, preview }: CsvConfirmProps) {
  const replacesCurrent = preview.diff.updated.length + preview.diff.removed.length > 0
  const [acknowledged, setAcknowledged] = useState(!replacesCurrent)
  const { pending, result, run } = useAction()

  if (result?.ok) {
    return (
      <section role="status" className="surface card-pad reveal mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 font-semibold text-[var(--status-passed)]">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /> {result.message}
        </p>
        <Link href={`/admin/curriculum?career=${file.careerId}`} className="primary-button shrink-0">
          Ver pensum <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    )
  }

  return (
    <section className="surface card-pad reveal mt-5 grid gap-4" aria-labelledby="csv-confirm-title">
      <div>
        <h2 id="csv-confirm-title" className="text-lg font-bold">
          Confirmar importación
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {replacesCurrent
            ? `Se reemplaza el pensum actual de ${preview.careerName}: ${preview.diff.created.length} materias nuevas, ${preview.diff.updated.length} actualizadas y ${preview.diff.removed.length} quitadas. Las prelaciones se cargan de nuevo desde el archivo.`
            : `Se cargan ${preview.rows.length} materias en el pensum de ${preview.careerName}, que hoy está vacío.`}
        </p>
      </div>
      {replacesCurrent && (
        <label className="flex items-start gap-3 text-sm font-semibold">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--brand-blue)]" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} />
          Entiendo que el pensum actual de {preview.careerName} se reemplaza por el del archivo.
        </label>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="primary-button"
          disabled={!acknowledged || pending}
          onClick={() => run(() => confirmCurriculumImport({ careerId: file.careerId, text: file.text }))}
        >
          {pending && <LoaderCircle className="h-4 w-4 animate-spin" />}
          Confirmar importación
        </button>
        <FormMessage result={result} />
      </div>
    </section>
  )
}
