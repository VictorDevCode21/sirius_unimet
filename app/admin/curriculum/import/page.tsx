import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getCurriculumEditor } from '@/control/controllers/curriculum.queries'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { CsvImport } from '@/presentation/portals/admin/curriculum/csv-import'

export default async function CurriculumImportPage({ searchParams }: { searchParams: Promise<{ career?: string }> }) {
  const { career } = await searchParams
  const { careers, career: selected } = await getCurriculumEditor(career)

  return (
    <div className="content-container">
      <PageHeading
        eyebrow="Administración"
        title="Importar pensum"
        description="Carga el pensum completo de una carrera desde un archivo CSV y revisa sus errores antes de guardarlo."
        actions={
          <Link href={selected ? `/admin/curriculum?career=${selected.id}` : '/admin/curriculum'} className="secondary-button">
            <ArrowLeft aria-hidden="true" /> Volver al pensum
          </Link>
        }
      />
      <CsvImport careers={careers} initialCareerId={selected?.id ?? null} />
    </div>
  )
}
