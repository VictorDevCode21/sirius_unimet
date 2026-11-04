import Link from 'next/link'
import { Download, ShieldCheck } from 'lucide-react'
import { getStudentReceipts } from '@/control/controllers/receipt.controller'
import { UnimetLogo } from '@/presentation/components/brand/unimet-logo'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { formatCurrency, formatSchedule, formatShortDate } from '@/presentation/lib/format'

interface ReceiptPageProps {
  searchParams: Promise<{ term?: string }>
}

export default async function ReceiptPage({ searchParams }: ReceiptPageProps) {
  const { term } = await searchParams
  const { terms, selected: enrollment } = await getStudentReceipts(term)

  if (!enrollment) {
    return (
      <div className="content-container">
        <PageHeading
          eyebrow="Comprobante"
          title="Sin inscripción confirmada"
          description="Aún no tienes una inscripción pagada. El comprobante aparece aquí cuando el pago de tu pre-inscripción queda aprobado."
        />
      </div>
    )
  }

  const downloadHref = `/student/receipt/download?term=${encodeURIComponent(enrollment.term)}`

  return (
    <div className="content-container">
      <PageHeading
        eyebrow="Comprobante"
        title="Comprobante de inscripción"
        description="Constancia de las secciones inscritas y pagadas en el período seleccionado."
        actions={
          <a href={downloadHref} download className="primary-button">
            <Download aria-hidden="true" /> Descargar PDF
          </a>
        }
      />

      {terms.length > 1 && (
        <nav className="reveal mb-5 flex flex-wrap gap-2" aria-label="Períodos con inscripción confirmada">
          {terms.map((name) => (
            <Link
              key={name}
              href={`/student/receipt?term=${encodeURIComponent(name)}`}
              className={`pill ${name === enrollment.term ? '!border-[var(--brand-blue)] !bg-[var(--brand-blue)] !text-white' : 'text-muted-foreground hover:text-foreground'}`}
              aria-current={name === enrollment.term ? 'page' : undefined}
            >
              Período {name}
            </Link>
          ))}
        </nav>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(16rem,0.55fr)]">
        <div className="certificate-preview reveal reveal-1">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="[&_p]:!text-[#17315a]">
              <UnimetLogo />
            </div>
            <span className="rounded-full border border-[#f68629]/40 px-3 py-1.5 text-[0.65rem] font-bold tracking-widest text-[#b34700]">
              PERÍODO {enrollment.term}
            </span>
          </div>
          <p className="mt-14 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#b34700]">Universidad Metropolitana</p>
          <h2 className="mt-2 font-display text-[clamp(1.8rem,3vw,2.6rem)] font-extrabold uppercase leading-none text-[#003087]">
            Comprobante de inscripción
          </h2>
          <p className="mt-4 max-w-2xl text-[0.92rem] leading-relaxed text-[#48617e]">
            Se certifica que <strong>{enrollment.student.name}</strong> se encuentra inscrito como estudiante de{' '}
            <strong>{enrollment.student.career}</strong> en el período <strong>{enrollment.term}</strong>.
          </p>
          <div className="certificate-table mt-8 overflow-x-auto text-[0.78rem]">
            <div className="text-[0.65rem] font-bold uppercase text-[#8a5a1f]">
              <span>Materia</span>
              <span>Horario</span>
              <span>UC</span>
            </div>
            {enrollment.sections.map((section) => (
              <div key={section.id}>
                <span>
                  <strong>{section.subject.name}</strong>
                  <small className="block font-mono text-[0.68rem] text-[#5d6b80]">
                    {section.subject.code} · Secc. {section.number}
                  </small>
                </span>
                <span>{formatSchedule(section.blocks) || 'Sin horario'}</span>
                <span>{section.subject.credits}</span>
              </div>
            ))}
            <div className="font-bold">
              <span>Total pagado: {formatCurrency(enrollment.amount)}</span>
              <span />
              <span>{enrollment.totalCredits}</span>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-dashed border-[#f68629] bg-[#fff7ee] px-4 py-3 text-[#00143d]">
            <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="text-[0.78rem]">
              <strong className="block uppercase tracking-wider">Pago simulado · Aprobado</strong>
              Referencia {enrollment.payment?.reference ?? 'no registrada'}
              {enrollment.payment && ` · ${formatShortDate(enrollment.payment.paidAt)}`}. No corresponde a un cobro real.
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-[#e2d2b4] pt-4 text-[0.7rem] text-[#5d6b80]">
            <span>Emitido el {formatShortDate(new Date())}</span>
            <strong className="text-[#003087]">Registro académico</strong>
          </div>
        </div>

        <div className="surface reveal reveal-2 h-fit p-6">
          <div className="stat-icon bg-[#f68629]/15 text-[var(--orange-text)]">
            <ShieldCheck aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-xl font-bold">Inscripción confirmada</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Este comprobante refleja tu inscripción pagada en el período {enrollment.term}. Descárgalo en PDF para guardarlo o imprimirlo.
          </p>
          <a href={downloadHref} download className="secondary-button mt-4 w-full">
            <Download aria-hidden="true" /> Descargar PDF
          </a>
        </div>
      </div>
    </div>
  )
}
