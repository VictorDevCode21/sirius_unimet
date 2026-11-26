import Link from 'next/link'
import { ArrowRight, Clock3, UsersRound } from 'lucide-react'
import type { ProfessorSection } from '@/control/controllers/professor-section.queries'
import { formatSchedule } from '@/presentation/lib/format'

// Sections of a professor with subject, schedule and number of enrolled students.
export function SectionsList({ sections }: { sections: ProfessorSection[] }) {
  if (!sections.length) {
    return <p className="surface card-pad text-center text-sm text-muted-foreground">No tienes secciones asignadas en este periodo</p>
  }

  return (
    <ul className="card-grid grid md:grid-cols-2">
      {sections.map((section) => (
        <li key={section.id}>
          <Link href={`/professor/sections/${section.id}`} className="stat-card reveal flex h-full flex-col gap-3">
            <div className="min-w-0">
              <p className="font-mono text-xs text-muted-foreground">
                {section.subject.code} · Sección {section.number}
              </p>
              <p className="mt-1 font-bold leading-tight">{section.subject.name}</p>
            </div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock3 className="h-4 w-4 shrink-0" aria-hidden="true" />
              {section.blocks.length ? formatSchedule(section.blocks) : 'Horario sin asignar'}
            </p>
            <p className="mt-auto flex items-center justify-between gap-2 text-sm font-semibold">
              <span className="flex items-center gap-2">
                <UsersRound className="h-4 w-4 shrink-0" aria-hidden="true" />
                {section.enrolled} {section.enrolled === 1 ? 'inscrito' : 'inscritos'}
              </span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </p>
          </Link>
        </li>
      ))}
    </ul>
  )
}
