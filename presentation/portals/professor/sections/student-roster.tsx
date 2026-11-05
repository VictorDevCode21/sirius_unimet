import type { SectionRoster } from '@/control/controllers/professor-section.queries'

// Student list of a section with name, email and career.
export function StudentRoster({ students }: { students: SectionRoster['students'] }) {
  if (!students.length) {
    return <p className="surface card-pad text-center text-sm text-muted-foreground">Esta sección aún no tiene estudiantes inscritos.</p>
  }

  return (
    <ul className="flex flex-col gap-3">
      {students.map((student) => (
        <li key={student.id} className="surface p-5">
          <p className="font-bold [overflow-wrap:anywhere]">{student.name}</p>
          <p className="mt-0.5 text-sm text-muted-foreground [overflow-wrap:anywhere]">{student.email}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{student.career ?? 'Sin carrera'}</p>
        </li>
      ))}
    </ul>
  )
}
