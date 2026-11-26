import { getDepartments } from '@/control/controllers/department.queries'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { DepartmentCard } from '@/presentation/portals/admin/departments/department-card'
import { DepartmentForm } from '@/presentation/portals/admin/departments/department-form'

export default async function DepartmentsPage() {
  const departments = await getDepartments()

  return (
    <div className="content-container">
      <PageHeading eyebrow="Administración" title="Departamentos" description="Crea los departamentos y asigna al jefe que gestionará sus secciones." />
      <DepartmentForm />
      <ul className="flex flex-col gap-3">
        {departments.map((department) => (
          <DepartmentCard key={department.id} department={department} />
        ))}
      </ul>
    </div>
  )
}
