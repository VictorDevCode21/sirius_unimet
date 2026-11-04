import { CalendarClock } from 'lucide-react'
import { getUpcomingTerm, listOffer } from '@/control/controllers/enrollment.controller'
import { GlossaryTerm } from '@/presentation/components/shared/glossary'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { formatCalendarDate } from '@/presentation/lib/format'
import { PreEnrollmentCatalog } from '@/presentation/portals/student/pre-enrollment/pre-enrollment-catalog'

export default async function PreEnrollmentPage() {
  const offer = await listOffer()

  if (!offer) {
    const upcoming = await getUpcomingTerm()
    return (
      <div className="content-container">
        <PageHeading eyebrow="Pre-inscripción" title="La inscripción no está abierta" />
        <section className="surface card-pad reveal reveal-1 flex items-start gap-4" aria-live="polite">
          <span className="stat-icon bg-[#003087]/10 text-[#003087] dark:bg-[#1859a9]/25 dark:text-[#8fb8ff]">
            <CalendarClock aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-bold">Próximo período</h2>
            {upcoming ? (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                El período <strong className="text-foreground">{upcoming.name}</strong> va del{' '}
                <strong className="text-foreground">{formatCalendarDate(upcoming.startsAt)}</strong> al{' '}
                <strong className="text-foreground">{formatCalendarDate(upcoming.endsAt)}</strong>. Podrás pre-inscribir tus
                materias cuando Control de Estudios abra la inscripción.
              </p>
            ) : (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Todavía no hay un próximo período programado. Revisa más adelante o consulta a Control de Estudios.
              </p>
            )}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="content-container">
      <PageHeading
        eyebrow={`Período ${offer.term.name}`}
        title="Pre-inscripción"
        description={
          <>
            Elige una sección por materia. Solo puedes agregar materias cuyas{' '}
            <GlossaryTerm entry="prerequisite">prelaciones</GlossaryTerm> ya aprobaste, sin choques de horario y hasta el
            máximo de <GlossaryTerm entry="uc">UC</GlossaryTerm> del período.
          </>
        }
      />
      <PreEnrollmentCatalog offer={offer} />
    </div>
  )
}
