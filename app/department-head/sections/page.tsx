import Link from 'next/link'
import { CheckCircle2, Info, Plus } from 'lucide-react'
import { listManagedSections } from '@/control/controllers/section-management.queries'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { SectionsTable } from '@/presentation/portals/department-head/sections/sections-table'
import { TermFilter } from '@/presentation/portals/department-head/sections/term-filter'

interface SectionsPageProps {
  searchParams: Promise<{ term?: string; created?: string; deleted?: string }>
}

export default async function SectionsPage({ searchParams }: SectionsPageProps) {
  const { term: requestedTerm, created, deleted } = await searchParams
  const { department, terms, term, sections } = await listManagedSections(requestedTerm)
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
        description="Crea las secciones de cada período con su profesor y cupo."
        actions={
          term?.editable ? (
            <Link href={`/department-head/sections/new?term=${encodeURIComponent(term.name)}`} className="primary-button">
              <Plus aria-hidden="true" /> Nueva sección
            </Link>
          ) : null
        }
      />

      <div className="reveal reveal-1 mb-5 flex flex-wrap items-end justify-between gap-4">
        <TermFilter terms={terms} selected={term?.name ?? null} />
        <p className="pill text-muted-foreground">
          {sections.length} {sections.length === 1 ? 'sección' : 'secciones'} en {term?.name ?? '—'}
        </p>
      </div>

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

      <SectionsTable sections={sections} termName={term?.name ?? ''} highlightId={createdSection?.id} />
    </div>
  )
}
