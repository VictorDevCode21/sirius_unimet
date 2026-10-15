import { getAcademicRecord } from '@/control/controllers/academic-record.controller'
import { getFlowchart } from '@/control/controllers/flowchart.controller'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { formatGrade } from '@/presentation/lib/format'
import { cn } from '@/presentation/lib/utils'

export default async function HistoryPage() {
  const [{ history, average }, { stats }] = await Promise.all([getAcademicRecord(), getFlowchart()])

  return (
    <div className="content-container">
      <PageHeading eyebrow="Tu trayectoria" title="Histórico académico" description="Consulta tus calificaciones publicadas y el avance de cada período." />

      <div className="surface reveal reveal-1 mb-6 flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <p className="eyebrow">Índice acumulado</p>
          <p className="mt-1 font-display text-6xl font-extrabold leading-none">{formatGrade(average)}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:w-80">
          <div className="rounded-2xl bg-muted p-4">
            <p className="font-display text-2xl font-extrabold">{stats.passedCredits}</p>
            <p className="text-xs text-muted-foreground">UC aprobadas</p>
          </div>
          <div className="rounded-2xl bg-muted p-4">
            <p className="font-display text-2xl font-extrabold">{history.length}</p>
            <p className="text-xs text-muted-foreground">Períodos cursados</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {history.map((term, index) => (
          <details key={term.name} className="surface reveal overflow-hidden" open={index < 2} style={{ animationDelay: `${Math.min(index, 6) * 0.05}s` }}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 sm:p-6">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--status-passed-bg)] font-display text-sm font-extrabold text-[var(--status-passed)]">
                  {term.name.split('-')[1]}
                </span>
                <div>
                  <p className="font-bold">Período {term.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {term.records.length} materias · {term.credits} UC
                  </p>
                </div>
              </div>
              <p className="font-display text-2xl font-extrabold text-[var(--status-passed)]">{formatGrade(term.average)}</p>
            </summary>
            <div className="border-t border-border px-5 pb-5 sm:px-6">
              {term.records.map((record) => (
                <div key={record.code} className="flex items-center justify-between gap-4 border-b border-border py-3.5 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{record.name}</p>
                    <p className="font-mono text-[0.7rem] text-muted-foreground">
                      {record.code} · {record.credits} UC · {record.passed ? 'Aprobada' : 'Reprobada'}
                    </p>
                  </div>
                  <span className={cn('font-display text-xl font-extrabold', !record.passed && 'text-red-500')}>{record.value}</span>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
