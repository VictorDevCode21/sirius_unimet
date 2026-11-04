import { CheckCircle2, Clock3, UsersRound } from 'lucide-react'
import type { ManagedSectionDetail } from '@/control/controllers/section-management.queries'
import { formatShortDate } from '@/presentation/lib/format'
import { OccupancyBar } from '@/presentation/portals/department-head/sections/occupancy-cell'

const statusLabels = {
  CONFIRMED: { label: 'Confirmada', icon: CheckCircle2, className: 'bg-[var(--status-passed-bg)] text-[var(--status-passed)]' },
  PENDING: { label: 'Pago pendiente', icon: Clock3, className: 'bg-[var(--status-available-bg)] text-[var(--status-available)]' },
  PRE_ENROLLED: { label: 'Pre-inscrita', icon: Clock3, className: 'bg-[var(--status-progress-bg)] text-[var(--status-progress)]' },
} as const

// Occupancy figures and the list of students holding a seat in the section.
export function SectionStudents({ detail }: { detail: ManagedSectionDetail }) {
  const { occupancy } = detail.section
  const figures = [
    { label: 'Cupo', value: occupancy.capacity },
    { label: 'Inscritos', value: occupancy.enrolled },
    { label: 'Disponibles', value: occupancy.available },
  ]

  return (
    <section className="surface reveal reveal-3 mt-5 p-5 sm:p-7" aria-labelledby="students-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="stat-icon bg-[#f68629]/15 text-[var(--orange-text)]">
            <UsersRound aria-hidden="true" />
          </span>
          <div>
            <h2 id="students-title" className="text-lg font-bold">
              Inscritos y cupos
            </h2>
            <p className="text-xs text-muted-foreground">
              {occupancy.confirmed} con pago confirmado · {occupancy.unpaid} pre-inscritos o con pago pendiente
            </p>
          </div>
        </div>
        <OccupancyBar occupancy={occupancy} />
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3">
        {figures.map((figure) => (
          <div key={figure.label} className="rounded-2xl bg-muted p-4">
            <dt className="text-xs font-semibold text-muted-foreground">{figure.label}</dt>
            <dd className="mt-1 font-display text-3xl font-extrabold">{figure.value}</dd>
          </div>
        ))}
      </dl>

      {detail.students.length ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <caption className="sr-only">Estudiantes inscritos en la sección</caption>
            <thead>
              <tr className="border-b border-border text-[0.68rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                <th scope="col" className="py-3 pr-3">Estudiante</th>
                <th scope="col" className="px-3 py-3">Carrera</th>
                <th scope="col" className="px-3 py-3">Estado</th>
                <th scope="col" className="py-3 pl-3 text-right">Desde</th>
              </tr>
            </thead>
            <tbody>
              {detail.students.map((student) => {
                const status = statusLabels[student.status]
                const Icon = status.icon
                return (
                  <tr key={student.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-3">
                      <strong className="block">{student.name}</strong>
                      <small className="text-xs text-muted-foreground">{student.email}</small>
                    </td>
                    <td className="px-3 py-3 text-xs">{student.career}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.68rem] font-bold ${status.className}`}>
                        <Icon className="h-3 w-3" aria-hidden="true" /> {status.label}
                      </span>
                    </td>
                    <td className="py-3 pl-3 text-right text-xs text-muted-foreground">{formatShortDate(student.since)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-5 rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
          Aún no hay estudiantes inscritos en esta sección.
        </p>
      )}
    </section>
  )
}
