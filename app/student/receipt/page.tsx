import { ShieldCheck } from 'lucide-react'
import { getCurrentEnrollment } from '@/control/controllers/enrollment.controller'
import { UnimetLogo } from '@/presentation/components/brand/unimet-logo'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { formatCurrency, formatSchedule, formatShortDate } from '@/presentation/lib/format'

export default async function ReceiptPage() {
  const enrollment = await getCurrentEnrollment()

  if (!enrollment) {
    return (
      <div className="content-container">
        <PageHeading eyebrow="Comprobante" title="Sin inscripción confirmada" description="Aún no tienes una inscripción pagada en el período actual." />
      </div>
    )
  }

  const totalCredits = enrollment.sections.reduce((sum, section) => sum + section.subject.credits, 0)

  return (
    <div className="content-container">
      <PageHeading
        eyebrow="Comprobante"
        title="Comprobante de inscripción"
        description="Constancia de las secciones inscritas y pagadas en el período académico vigente."
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(16rem,0.55fr)]">
        <div className="certificate-preview reveal reveal-1">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="[&_p]:!text-[#17315a]">
              <UnimetLogo />
            </div>
            <span className="rounded-full border border-[#f68629]/40 px-3 py-1.5 text-[0.65rem] font-bold tracking-widest text-[#b65c11]">
              PERÍODO {enrollment.term}
            </span>
          </div>
          <p className="mt-14 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#b34700]">Universidad Metropolitana</p>
          <h2 className="mt-2 font-display text-[clamp(1.8rem,3vw,2.6rem)] font-extrabold uppercase leading-none text-[#003087]">
            Comprobante de inscripción
          </h2>
          <p className="mt-4 max-w-2xl text-[0.92rem] leading-relaxed text-[#48617e]">
            Se certifica que <strong>{enrollment.student.name}</strong> se encuentra inscrito como estudiante activo de{' '}
            <strong>{enrollment.student.career}</strong> en el período <strong>{enrollment.term}</strong>.
          </p>
          <div className="certificate-table mt-8 overflow-x-auto text-[0.78rem]">
            <div className="text-[0.65rem] font-bold uppercase text-[#a06a2c]">
              <span>Materia</span>
              <span>Horario</span>
              <span>UC</span>
            </div>
            {enrollment.sections.map((section) => (
              <div key={section.id}>
                <span>
                  <strong>{section.subject.name}</strong>
                  <small className="block font-mono text-[0.68rem] text-[#74849a]">
                    {section.subject.code} · Secc. {section.number}
                  </small>
                </span>
                <span>{formatSchedule(section.blocks)}</span>
                <span>{section.subject.credits}</span>
              </div>
            ))}
            <div className="font-bold">
              <span>Total pagado: {formatCurrency(enrollment.amount)}</span>
              <span />
              <span>{totalCredits}</span>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-[#e2d2b4] pt-4 text-[0.7rem] text-[#74849a]">
            <span>Emitido el {formatShortDate(new Date())}</span>
            <strong className="text-[#003087]">Registro académico</strong>
          </div>
        </div>

        <div className="surface reveal reveal-2 h-fit p-6">
          <div className="stat-icon bg-[#f68629]/15 text-[var(--orange-text)]">
            <ShieldCheck />
          </div>
          <h3 className="mt-4 text-xl font-bold">Inscripción confirmada</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Este comprobante refleja tu inscripción pagada. La descarga en PDF estará disponible próximamente.
          </p>
        </div>
      </div>
    </div>
  )
}
