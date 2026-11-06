import { getCareers } from '@/control/controllers/career.queries'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { CareerCard } from '@/presentation/portals/admin/careers/career-card'
import { CareerForm } from '@/presentation/portals/admin/careers/career-form'

export default async function CareersPage() {
  const { careers, departments } = await getCareers()

  return (
    <div className="content-container">
      <PageHeading eyebrow="Administración" title="Carreras" description="Registra las carreras de Ingeniería para asignar estudiantes y materias." />
      <CareerForm departments={departments} />
      <ul className="flex flex-col gap-3">
        {careers.map((career) => (
          <CareerCard key={career.id} career={career} />
        ))}
      </ul>
    </div>
  )
}
