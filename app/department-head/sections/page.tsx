import Link from 'next/link'
import { CheckCircle2, Info, Plus, Search } from 'lucide-react'
import { listManagedSections } from '@/control/controllers/section-management.queries'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { SectionsTable } from '@/presentation/portals/department-head/sections/sections-table'
import { TermFilter } from '@/presentation/portals/department-head/sections/term-filter'

interface SectionsPageProps {
  searchParams: Promise<{ term?: string; q?: string; created?: string; deleted?: string }>
}

export default async function SectionsPage({ searchParams }: SectionsPageProps) {
  const { term: requestedTerm, q = '', created, deleted } = await searchParams
  const { department, terms, term, sections, totals } = await listManagedSections(requestedTerm, q)
  const createdSection = sections.find((section) => section.id === created)

  if (!department) {
    return (
      <div className="content-container">
        <PageHeading
          eyebrow="Secciones"
          title="Sin departamento asignado"
          description="Tu cuenta de jefe de departamento aún no tiene un departamento asignado. Solicita a la administración que te asigne uno."
        />
      </div>
    )
  }

  return (
    <div className="content-container">
      <PageHeading
        eyebrow={`Departamento de ${department.name}`}
        title="Secciones"
        description="Crea las secciones de cada período con su profesor, cupo y horario, y revisa cuántos estudiantes ocupan cada una."
        actions={
          term?.editable ? (
            <Link href={`/department-head/sections/new?term=${encodeURIComponent(term.name)}`} className="primary-button">
              <Plus aria-hidden="true" /> Nueva sección
            </Link>
          ) : null
        }
      />

      <div className="reveal reveal-1 mb-5 flex flex-wrap items-end gap-4">
        <TermFilter terms={terms} selected={term?.name ?? null} />
        <form action="/department-head/sections" className="flex min-w-[16rem] flex-1 flex-col gap-1.5 text-xs font-bold text-muted-foreground" role="search">
          <label htmlFor="section-search">Buscar materia</label>
          <div className="flex gap-2">
            <span className="search-box !py-2.5">
              <Search aria-hidden="true" />
              <input id="section-search" name="q" defaultValue={q} placeholder="Nombre o código" />
            </span>
            {term && <input type="hidden" name="term" value={term.name} />}
            <button type="submit" className="secondary-button !py-2">
              Buscar
            </button>
          </div>
        </form>
      </div>

      <dl className="reveal reveal-1 mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Secciones', value: totals.sections },
          { label: 'Cupo total', value: totals.capacity },
          { label: 'Inscritos', value: totals.enrolled },
          { label: 'Disponibles', value: totals.available },
        ].map((figure) => (
          <div key={figure.label} className="stat-card !p-4">
            <dt className="text-xs font-semibold text-muted-foreground">{figure.label}</dt>
            <dd className="mt-1 font-display text-3xl font-extrabold">{figure.value}</dd>
          </div>
        ))}
      </dl>

      {createdSection && (
        <p className="reveal mb-5 flex items-start gap-2 rounded-2xl bg-[var(--status-passed-bg)] p-4 text-sm font-semibold text-[var(--status-passed)]" role="status">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Sección {createdSection.number} de {createdSection.subject.name} creada con cupo de {createdSection.capacity} y profesor{' '}
          {createdSection.professor.name}.
        </p>
      )}

      {deleted && (
        <p className="reveal mb-5 flex items-start gap-2 rounded-2xl bg-[var(--status-passed-bg)] p-4 text-sm font-semibold text-[var(--status-passed)]" role="status">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          La sección se eliminó junto con su horario.
        </p>
      )}

      {term && !term.editable && (
        <p className="reveal mb-5 flex items-start gap-2 rounded-2xl bg-muted p-4 text-sm text-muted-foreground" role="note">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          El período {term.name} ya finalizó: sus secciones se muestran solo como consulta.
        </p>
      )}

      <SectionsTable sections={sections} termName={term?.name ?? ''} highlightId={createdSection?.id} filtered={Boolean(q.trim())} />
    </div>
  )
}
