import { CircleSlash, LockKeyhole } from 'lucide-react'
import { toRoman } from '@/presentation/lib/format'

interface PendingSubject {
  id: string
  code: string
  name: string
  term: number
  pendingRequirements: string[]
}

// Blocked subjects of the current and next curriculum terms, with the requirements the student still has to meet.
export function PendingPrerequisites({ subjects }: { subjects: PendingSubject[] }) {
  return (
    <section className="surface card-pad reveal reveal-3 mt-5" aria-labelledby="pending-title">
      <h2 id="pending-title" className="text-lg font-bold">
        Prelaciones pendientes
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Materias bloqueadas de tu trimestre actual y el siguiente, y lo que te falta para cursarlas.</p>
      {subjects.length ? (
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {subjects.map((subject) => (
            <li key={subject.id} className="rounded-[1.25rem] border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[0.7rem] font-bold text-muted-foreground">
                    {subject.code} · Trimestre {toRoman(subject.term)}
                  </p>
                  <p className="mt-0.5 font-semibold leading-tight">{subject.name}</p>
                </div>
                <LockKeyhole className="h-4 w-4 shrink-0 text-[var(--status-blocked)]" aria-label="Bloqueada" />
              </div>
              <ul className="mt-3 flex flex-col gap-1.5">
                {subject.pendingRequirements.map((requirement) => (
                  <li key={requirement} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CircleSlash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--status-blocked)]" aria-hidden="true" />
                    <span>{requirement}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm font-semibold text-[var(--status-passed)]">No tienes prelaciones pendientes para avanzar al siguiente trimestre.</p>
      )}
    </section>
  )
}
