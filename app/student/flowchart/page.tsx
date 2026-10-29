import { CURRICULUM_BRANCHES, CURRICULUM_TERMS, getFlowchart } from '@/control/controllers/flowchart.controller'
import { GlossaryTerm } from '@/presentation/components/shared/glossary'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { FlowchartBoard } from '@/presentation/portals/student/flowchart/flowchart-board'

export default async function FlowchartPage() {
  const { career, stats, subjects } = await getFlowchart()

  return (
    <div className="content-container">
      <PageHeading
        eyebrow={career.name}
        title="Mi flujograma"
        description={
          <>
            Flujograma oficial de componentes educativos obligatorios. Cada materia muestra sus{' '}
            <GlossaryTerm entry="uc">UC</GlossaryTerm> y su estado; ábrela para ver sus{' '}
            <GlossaryTerm entry="prerequisite">prelaciones</GlossaryTerm>.
          </>
        }
        actions={
          <>
            <div className="min-w-[11rem] rounded-[1.25rem] border border-border bg-card px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs font-semibold text-muted-foreground">Avance</span>
                <strong className="font-display text-xl font-extrabold">{stats.progressPercent.toFixed(1)}%</strong>
              </div>
              <div className="progress-track mt-2">
                <span style={{ width: `${stats.progressPercent}%` }} />
              </div>
            </div>
            <div className="min-w-[11rem] rounded-[1.25rem] border border-border bg-card px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs font-semibold text-muted-foreground">Aprobadas</span>
                <strong className="font-display text-xl font-extrabold">
                  {stats.passedSubjects}/{stats.totalSubjects}
                </strong>
              </div>
              <div className="progress-track orange mt-2">
                <span style={{ width: `${(stats.passedSubjects / Math.max(stats.totalSubjects, 1)) * 100}%` }} />
              </div>
            </div>
          </>
        }
      />

      <FlowchartBoard subjects={subjects} terms={CURRICULUM_TERMS} branches={CURRICULUM_BRANCHES} currentTerm={stats.currentCurriculumTerm} />
    </div>
  )
}
