import Link from 'next/link'
import { SlidersHorizontal } from 'lucide-react'
import type { TermView } from '@/control/controllers/term.queries'
import { formatCurrency, formatDateOnly } from '@/presentation/lib/format'
import { EnrollmentToggle } from '@/presentation/portals/admin/terms/enrollment-toggle'

// List of academic periods with their dates and enrollment status.
export function TermsList({ terms }: { terms: TermView[] }) {
  if (!terms.length) {
    return <p className="surface card-pad text-center text-sm text-muted-foreground">Aún no hay periodos registrados.</p>
  }

  return (
    <ul className="flex flex-col gap-3">
      {terms.map((term) => (
        <li key={term.id} className="surface reveal flex flex-col gap-3 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-display text-xl font-extrabold">{term.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {formatDateOnly(term.startsAt)} – {formatDateOnly(term.endsAt)}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Monto por UC: {term.ratePerCredit > 0 ? formatCurrency(term.ratePerCredit) : 'sin configurar'} · Máximo:{' '}
                {term.maxCredits > 0 ? `${term.maxCredits} UC` : 'sin configurar'}
              </p>
            </div>
            <span className="pill self-start sm:self-auto">{term.open ? 'Abierto' : 'Cerrado'}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/admin/terms/${term.id}`} className="secondary-button">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Configurar
            </Link>
            <EnrollmentToggle termId={term.id} open={term.open} />
          </div>
        </li>
      ))}
    </ul>
  )
}
