import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getTerm } from '@/control/controllers/term.queries'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { formatDateOnly } from '@/presentation/lib/format'
import { TermSettings } from '@/presentation/portals/admin/terms/term-settings'

export default async function TermSettingsPage({ params }: { params: Promise<{ termId: string }> }) {
  const { termId } = await params
  const term = await getTerm(termId)
  if (!term) notFound()

  return (
    <div className="content-container">
      <Link href="/admin/terms" className="secondary-button mb-5">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a periodos
      </Link>
      <PageHeading
        eyebrow="Configuración del periodo"
        title={term.name}
        description={`${formatDateOnly(term.startsAt)} – ${formatDateOnly(term.endsAt)} · ${term.open ? 'Abierto' : 'Cerrado'}`}
      />
      <TermSettings term={term} />
    </div>
  )
}
