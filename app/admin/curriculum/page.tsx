import { getCurriculumEditor } from '@/control/controllers/curriculum.queries'
import { CURRICULUM_BRANCHES, CURRICULUM_TERMS } from '@/domain/curriculum/curriculum-grid'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { CurriculumGrid } from '@/presentation/portals/admin/curriculum/curriculum-grid'

export default async function CurriculumPage({ searchParams }: { searchParams: Promise<{ career?: string }> }) {
  const { career } = await searchParams
  const editor = await getCurriculumEditor(career)

  return (
    <div className="content-container">
      <PageHeading
        eyebrow="Administración"
        title="Pensum"
        description="Registra las materias de cada carrera en la cuadrícula del pensum: una materia por trimestre y rama."
      />
      <CurriculumGrid {...editor} terms={CURRICULUM_TERMS} branches={CURRICULUM_BRANCHES} />
    </div>
  )
}
