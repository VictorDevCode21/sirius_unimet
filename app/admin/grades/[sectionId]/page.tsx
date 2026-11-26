import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getCorrectableGrades } from '@/control/controllers/grade-correction.queries'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { GradeForm } from '@/presentation/portals/professor/sections/grade-form'
import { GradeOutcomeBadge } from '@/presentation/portals/professor/sections/grade-outcome-badge'

export default async function SectionGradeCorrectionPage({ params }: { params: Promise<{ sectionId: string }> }) {
  const { sectionId } = await params
  const section = await getCorrectableGrades(sectionId)
  if (!section) notFound()

  return (
    <div className="content-container">
      <Link href={`/admin/grades?term=${encodeURIComponent(section.term.name)}`} className="secondary-button mb-5">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a notas
      </Link>
      <PageHeading eyebrow={`${section.subject.code} · Periodo ${section.term.name}`} title={section.subject.name} description={`Sección ${section.number}`} />
      <ul className="flex flex-col gap-3">
        {section.grades.map(({ value, status, student }) => (
          <li key={student.id} className="surface flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="font-bold [overflow-wrap:anywhere]">{student.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground [overflow-wrap:anywhere]">{student.email}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <GradeOutcomeBadge outcome={status} />
              <GradeForm sectionId={section.id} studentId={student.id} studentName={student.name} grade={value} mode="admin" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
