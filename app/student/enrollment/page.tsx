import Link from 'next/link'
import { CalendarClock } from 'lucide-react'
import { getRegistration } from '@/control/controllers/registration.queries'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { ROUTES } from '@/presentation/lib/routes'
import { RegistrationPanel } from '@/presentation/portals/student/registration/registration-panel'
import { TurnCard } from '@/presentation/portals/student/registration/turn-card'

export default async function EnrollmentPage() {
  const registration = await getRegistration()

  if (!registration) {
    return (
      <div className="content-container">
        <PageHeading eyebrow="Inscripción" title="No hay un período abierto" />
        <section className="surface card-pad reveal reveal-1 flex items-start gap-4">
          <span className="stat-icon bg-[#003087]/10 text-[#003087] dark:bg-[#1859a9]/25 dark:text-[#8fb8ff]">
            <CalendarClock aria-hidden="true" />
          </span>
          <p className="text-sm leading-relaxed text-muted-foreground">
            La inscripción se habilita cuando Control de Estudios abre el próximo período. Mientras tanto puedes revisar tu{' '}
            <Link href={ROUTES.studentPayments} className="font-bold text-[var(--accent-text)]">
              estado de cuenta
            </Link>
            .
          </p>
        </section>
      </div>
    )
  }

  return (
    <div className="content-container">
      <PageHeading
        eyebrow={`Período ${registration.term.name}`}
        title="Inscripción"
        description="En tu turno, inscribe las materias que pre-inscribiste. Al inscribir se toman los cupos y recibes tu constancia; el pago se hace después en Pagos."
      />
      <div className="section-grid grid xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <RegistrationPanel registration={registration} />
        <TurnCard turn={registration.turn} hold={registration.hold} />
      </div>
    </div>
  )
}
