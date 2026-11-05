import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getSectionFormOptions } from '@/control/controllers/section-management.queries'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { SectionForm } from '@/presentation/portals/department-head/sections/section-form'

interface NewSectionPageProps {
  searchParams: Promise<{ term?: string }>
}

export default async function NewSectionPage({ searchParams }: NewSectionPageProps) {
  const { term } = await searchParams
  const options = await getSectionFormOptions()

  return (
    <div className="content-container">
      <Link href="/department-head/sections" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a secciones
      </Link>
      <PageHeading
        eyebrow="Secciones"
        title="Nueva sección"
        description="Elige el período, la materia, el profesor y el cupo. El horario se asigna después desde el detalle de la sección."
      />
      {options && options.terms.length ? (
        <SectionForm options={options} defaultTermName={term} />
      ) : (
        <div className="surface card-pad text-center text-sm text-muted-foreground">
          {options ? 'No hay períodos vigentes o futuros en los que crear secciones.' : 'Tu cuenta no tiene un departamento asignado.'}
        </div>
      )}
    </div>
  )
}
