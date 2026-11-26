import { getPaymentSummary } from '@/control/controllers/payment.queries'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { PaymentSimulator } from '@/presentation/portals/student/payment/payment-simulator'

export default async function PaymentPage() {
  const summary = await getPaymentSummary()

  if (!summary) {
    return (
      <div className="content-container">
        <PageHeading eyebrow="Pago" title="Período cerrado" description="No hay un período de pre-inscripción abierto, así que no hay pagos pendientes." />
      </div>
    )
  }

  return (
    <div className="content-container">
      <PageHeading
        eyebrow={`Período ${summary.term.name}`}
        title="Pago de inscripción"
        description="Simulador de pago del proyecto: no se conecta con bancos ni realiza cobros reales."
      />
      <PaymentSimulator summary={summary} />
    </div>
  )
}
