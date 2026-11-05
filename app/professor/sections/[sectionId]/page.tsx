import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getMySectionRoster } from '@/control/controllers/professor-section.queries'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { formatSchedule } from '@/presentation/lib/format'
import { StudentRoster } from '@/presentation/portals/professor/sections/student-roster'

export default async function ProfessorSectionPage({ params }: { params: Promise<{ sectionId: string }> }) {
  const { sectionId } = await params
  const section = await getMySectionRoster(sectionId)
  if (!section) notFound()

  return (
    <div className="content-container">
      <Link href="/professor/sections" className="secondary-button mb-5">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a mis secciones
      </Link>
      <PageHeading
        eyebrow={`${section.subject.code} · Periodo ${section.termName}`}
        title={section.subject.name}
        description={`Sección ${section.number} · ${section.blocks.length ? formatSchedule(section.blocks) : 'Horario sin asignar'}`}
      />
      <StudentRoster students={section.students} />
    </div>
  )
}
