import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getCurriculumEditor } from '@/control/controllers/curriculum.queries'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { CsvUpload } from '@/presentation/portals/admin/curriculum/csv-upload'

export default async function CurriculumImportPage({ searchParams }: { searchParams: Promise<{ career?: string }> }) {
  const { career } = await searchParams
  const { careers, career: selected } = await getCurriculumEditor(career)

  return (
    <div className="content-container">
      <PageHeading
        eyebrow="Administración"
        title="Importar pensum"
        description="Carga el pensum completo de una carrera desde un archivo CSV."
        actions={
          <Link href={selected ? `/admin/curriculum?career=${selected.id}` : '/admin/curriculum'} className="secondary-button">
            <ArrowLeft aria-hidden="true" /> Volver al pensum
          </Link>
        }
      />
      <CsvUpload careers={careers} initialCareerId={selected?.id ?? null} />
    </div>
  )
}
