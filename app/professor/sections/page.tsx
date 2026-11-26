import type { Metadata } from 'next'
import { getMySections } from '@/control/controllers/professor-section.queries'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { SectionsList } from '@/presentation/portals/professor/sections/sections-list'

export const metadata: Metadata = { title: 'Mis secciones | Sirius UNIMET' }

export default async function ProfessorSectionsPage() {
  const { termName, sections } = await getMySections()

  return (
    <div className="content-container">
      <PageHeading eyebrow={termName ? `Periodo ${termName}` : 'Docencia'} title="Mis secciones" description="Consulta tus secciones asignadas y la lista de estudiantes de cada una." />
      <SectionsList sections={sections} />
    </div>
  )
}
