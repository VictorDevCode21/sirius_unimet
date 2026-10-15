import { listOffer } from '@/control/controllers/enrollment.controller'
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
        description="Elige una sección por materia. Solo puedes agregar materias cuyas prelaciones ya aprobaste, sin choques de horario y hasta el máximo de UC del período."
      />
      <PreEnrollmentCatalog offer={offer} />
    </div>
  )
}
