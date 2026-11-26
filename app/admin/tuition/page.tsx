import type { Metadata } from 'next'
import { getTerms } from '@/control/controllers/term.queries'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { TuitionList } from '@/presentation/portals/admin/terms/tuition-list'

export const metadata: Metadata = { title: 'Matrícula | Sirius UNIMET' }

export default async function TuitionPage() {
  const terms = await getTerms()

  return (
    <div className="content-container">
      <PageHeading
        eyebrow="Administración"
        title="Costo de matrícula"
        description="Fija el monto por UC de cada periodo. El monto de una inscripción es UC inscritas × monto por UC; las inscripciones ya pagadas conservan el monto con el que se pagaron."
      />
      <TuitionList terms={terms} />
    </div>
  )
}
