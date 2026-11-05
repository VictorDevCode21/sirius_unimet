import type { TermView } from '@/control/controllers/term.queries'
import { formatDateOnly } from '@/presentation/lib/format'

// List of academic periods with their dates and enrollment status.
export function TermsList({ terms }: { terms: TermView[] }) {
  if (!terms.length) {
    return <p className="surface card-pad text-center text-sm text-muted-foreground">Aún no hay periodos registrados.</p>
  }

  return (
    <ul className="flex flex-col gap-3">
      {terms.map((term) => (
        <li key={term.id} className="surface reveal flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-display text-xl font-extrabold">{term.name}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {formatDateOnly(term.startsAt)} – {formatDateOnly(term.endsAt)}
            </p>
          </div>
          <span className="pill self-start sm:self-auto">{term.open ? 'Abierto' : 'Cerrado'}</span>
        </li>
      ))}
    </ul>
  )
}
