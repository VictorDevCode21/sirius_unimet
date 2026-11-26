import Link from 'next/link'
import { AlarmClock, LockKeyhole, TrendingUp } from 'lucide-react'
import type { Registration } from '@/control/controllers/registration.queries'
import { formatCaracasDateTime, formatCurrency, formatGrade } from '@/presentation/lib/format'
import { ROUTES } from '@/presentation/lib/routes'

const stateLabels = {
  NOT_SCHEDULED: 'Sin fecha de inscripción',
  UPCOMING: 'Turno próximo',
  ACTIVE: 'Tu turno está abierto',
  CLOSED: 'Inscripción cerrada',
} as const

// Enrollment turn of the student (academic index, hour and state) and the financial hold, if any.
export function TurnCard({ turn, hold }: { turn: Registration['turn']; hold: Registration['hold'] }) {
  return (
    <aside className="flex h-fit flex-col gap-5">
      <section className="surface card-pad reveal reveal-2" aria-labelledby="turn-title">
        <span className="stat-icon bg-[#f68629]/15 text-[var(--orange-text)]">
          <AlarmClock aria-hidden="true" />
        </span>
        <h2 id="turn-title" className="mt-4 text-lg font-bold">
          Turno de inscripción
        </h2>
        <p className="mt-1 text-sm font-semibold" data-testid="turn-state">
          {stateLabels[turn.state]}
        </p>
        {turn.turnAt && <p className="mt-1 font-display text-2xl font-extrabold">{formatCaracasDateTime(turn.turnAt)}</p>}
        {turn.closesAt && <p className="mt-1 text-xs text-muted-foreground">La inscripción cierra el {formatCaracasDateTime(turn.closesAt)} (hora de Caracas).</p>}

        <dl className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-muted p-3">
            <dt className="text-xs font-semibold text-muted-foreground">IAA</dt>
            <dd className="mt-1 font-display text-2xl font-extrabold">{formatGrade(turn.iaa)}</dd>
          </div>
          <div className="rounded-2xl bg-muted p-3">
            <dt className="text-xs font-semibold text-muted-foreground">Promedio último trimestre</dt>
            <dd className="mt-1 font-display text-2xl font-extrabold">{formatGrade(turn.lastTermAverage)}</dd>
          </div>
        </dl>
        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {turn.firstTrimester
            ? 'Estás en tu primer trimestre: inscribes en la primera hora del primer día.'
            : 'Los turnos se asignan por IAA y, en empate, por el promedio del último trimestre. La inscripción dura 2 días, de 7:00 a 17:00.'}
        </p>
      </section>

      {hold.length > 0 && (
        <section role="alert" className="surface card-pad reveal reveal-3 border border-red-500/30" aria-labelledby="hold-title">
          <h2 id="hold-title" className="flex items-center gap-2 text-lg font-bold text-[var(--status-failed)]">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" /> Bloqueo financiero
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">No puedes inscribir hasta pagar en su totalidad los períodos anteriores:</p>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm">
            {hold.map((debt) => (
              <li key={debt.termName} className="flex justify-between rounded-xl bg-muted px-3 py-2">
                <span className="font-semibold">Período {debt.termName}</span>
                <strong>{formatCurrency(debt.balance)}</strong>
              </li>
            ))}
          </ul>
          <Link href={ROUTES.studentPayments} className="primary-button mt-4 w-full">
            Ir a Pagos
          </Link>
        </section>
      )}
    </aside>
  )
}
