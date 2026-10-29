import { listOffer } from '@/control/controllers/enrollment.controller'
import { GlossaryTerm } from '@/presentation/components/shared/glossary'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { PreEnrollmentCatalog } from '@/presentation/portals/student/pre-enrollment/pre-enrollment-catalog'

export default async function PreEnrollmentPage() {
  const offer = await listOffer()

  if (!offer) {
    return (
      <div className="content-container">
        <PageHeading eyebrow="Pre-inscripción" title="Período cerrado" description="No hay un período de inscripción abierto en este momento." />
      </div>
    )
  }

  return (
    <div className="content-container">
      <PageHeading
        eyebrow={`Período ${offer.term.name}`}
        title="Pre-inscripción"
        description={
          <>
            Elige una sección por materia. Solo puedes agregar materias cuyas{' '}
            <GlossaryTerm entry="prerequisite">prelaciones</GlossaryTerm> ya aprobaste, sin choques de horario y hasta el
            máximo de <GlossaryTerm entry="uc">UC</GlossaryTerm> del período.
          </>
        }
      />
      <PreEnrollmentCatalog offer={offer} />
    </div>
  )
}
