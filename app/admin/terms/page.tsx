import { getTerms } from '@/control/controllers/term.queries'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { TermForm } from '@/presentation/portals/admin/terms/term-form'
import { TermsList } from '@/presentation/portals/admin/terms/terms-list'

export default async function TermsPage() {
  const terms = await getTerms()

  return (
    <div className="content-container">
      <PageHeading eyebrow="Administración" title="Periodos" description="Crea los periodos académicos para organizar la oferta y la inscripción de cada trimestre." />
      <TermForm />
      <TermsList terms={terms} />
    </div>
  )
}
