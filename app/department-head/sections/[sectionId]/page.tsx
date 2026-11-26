import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Info } from 'lucide-react'
import { getManagedSection } from '@/control/controllers/section-management.queries'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { ScheduleEditor } from '@/presentation/portals/department-head/sections/schedule-editor'
import { SectionEditor } from '@/presentation/portals/department-head/sections/section-editor'
import { SectionStudents } from '@/presentation/portals/department-head/sections/section-students'

interface SectionDetailPageProps {
  params: Promise<{ sectionId: string }>
}

export default async function SectionDetailPage({ params }: SectionDetailPageProps) {
  const { sectionId } = await params
  const detail = await getManagedSection(sectionId)
  if (!detail) notFound()
  const { section } = detail
  const backHref = `/department-head/sections?term=${encodeURIComponent(section.term.name)}`

  return (
    <div className="content-container">
      <Link href={backHref} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a secciones de {section.term.name}
      </Link>
      <PageHeading
        eyebrow={`Período ${section.term.name} · ${section.subject.code}`}
        title={`${section.subject.name} · Sección ${section.number}`}
        description={`${section.subject.career} · ${section.subject.credits} UC`}
      />

      {!section.term.editable && (
        <p className="reveal mb-5 flex items-start gap-2 rounded-2xl bg-muted p-4 text-sm text-muted-foreground" role="note">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          El período {section.term.name} ya finalizó: esta sección se muestra solo como consulta.
        </p>
      )}

      <SectionEditor detail={detail} backHref={backHref} />
      <SectionStudents detail={detail} />
      <ScheduleEditor section={section} />
    </div>
  )
}
