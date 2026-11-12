import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { CurriculumPreview } from '@/control/controllers/curriculum.controller'
import { toRoman } from '@/presentation/lib/format'
import { cn } from '@/presentation/lib/utils'

// Preview of a curriculum file: summary of changes, every error with its line and the rows as they will be saved.
export function CsvPreview({ preview }: { preview: CurriculumPreview }) {
  const { rows, issues, diff } = preview
  const valid = issues.length === 0

  return (
    <section className="surface reveal mt-5 overflow-hidden" aria-labelledby="csv-preview-title">
      <div className="flex flex-col gap-3 border-b border-border p-5 sm:p-6">
        <h2 id="csv-preview-title" className="text-lg font-bold">
          Vista previa
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Materias en el archivo', value: rows.length },
            { label: 'Nuevas', value: diff.created.length },
            { label: 'Se actualizan', value: diff.updated.length },
            { label: 'Se quitan del pensum', value: diff.removed.length },
          ].map((item) => (
            <div key={item.label} className="detail-stat">
              <dt>{item.label}</dt>
              <dd className="font-display text-2xl font-extrabold">{item.value}</dd>
            </div>
          ))}
        </dl>
        {valid ? (
          <p role="status" className="flex items-center gap-2 text-sm font-semibold text-[var(--status-passed)]">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Sin errores.
          </p>
        ) : (
          <div role="alert" className="rounded-[1.25rem] bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
            <p className="flex items-center gap-2 font-bold">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" /> {issues.length} {issues.length === 1 ? 'error' : 'errores'}
            </p>
            <ul className="mt-2 flex max-h-56 list-disc flex-col gap-1 overflow-y-auto pl-5">
              {issues.map((issue, index) => (
                <li key={index}>
                  {issue.line ? <strong>Línea {issue.line}: </strong> : null}
                  {issue.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-4 py-3 font-bold">Línea</th>
              <th className="px-4 py-3 font-bold">Código</th>
              <th className="px-4 py-3 font-bold">Nombre</th>
              <th className="px-4 py-3 font-bold">UC</th>
              <th className="px-4 py-3 font-bold">Celda</th>
              <th className="px-4 py-3 font-bold">Prelaciones</th>
              <th className="px-4 py-3 font-bold">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.line} className={cn('border-b border-border align-top', row.errors.length && 'bg-red-500/5')}>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{row.line}</td>
                <td className="px-4 py-2.5 font-mono text-xs font-bold">{row.code || '—'}</td>
                <td className="px-4 py-2.5">{row.name || '—'}</td>
                <td className="px-4 py-2.5">{Number.isNaN(row.credits) ? '—' : row.credits}</td>
                <td className="whitespace-nowrap px-4 py-2.5">{Number.isNaN(row.term) ? '—' : `${toRoman(row.term)} · ${Number.isNaN(row.branch) ? '—' : row.branch}`}</td>
                <td className="px-4 py-2.5 text-xs">
                  {[row.prerequisiteCodes.join(', '), row.minCredits ? `${row.minCredits} UC` : '', row.alternative ? `ó ${row.alternative.credits}${row.alternative.block}` : '']
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </td>
                <td className="px-4 py-2.5 text-xs font-semibold">
                  {row.errors.length ? (
                    <ul className="flex flex-col gap-0.5 text-red-600 dark:text-red-400">
                      {row.errors.map((error) => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-[var(--status-passed)]">Válida</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
