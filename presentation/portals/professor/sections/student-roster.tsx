import type { SectionRoster } from '@/control/controllers/professor-section.queries'
import { GradeForm } from '@/presentation/portals/professor/sections/grade-form'
import { PublishGradesButton } from '@/presentation/portals/professor/sections/publish-grades-button'

// Student list of a section with name, email, career and final grade.
export function StudentRoster({ sectionId, students }: { sectionId: string; students: SectionRoster['students'] }) {
  if (!students.length) {
    return <p className="surface card-pad text-center text-sm text-muted-foreground">Esta sección aún no tiene estudiantes inscritos.</p>
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {students.map((student) => (
          <li key={student.id} className="surface flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="font-bold [overflow-wrap:anywhere]">{student.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground [overflow-wrap:anywhere]">{student.email}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{student.career ?? 'Sin carrera'}</p>
            </div>
            <GradeForm sectionId={sectionId} studentId={student.id} studentName={student.name} grade={student.grade} />
          </li>
        ))}
      </ul>
      <PublishGradesButton sectionId={sectionId} />
    </>
  )
}
