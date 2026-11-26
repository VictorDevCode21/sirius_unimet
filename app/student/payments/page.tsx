import { getPaymentsOverview } from '@/control/controllers/payment.queries'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { PaymentsCenter } from '@/presentation/portals/student/payments/payments-center'

export default async function PaymentsPage() {
  const overview = await getPaymentsOverview()

  return (
    <div className="content-container">
      <PageHeading
        eyebrow="Pagos"
        title="Estado de cuenta"
        description="Paga lo que inscribiste en cada período, en uno o varios abonos. Los pagos en bolívares se calculan con la tasa oficial del BCV del día."
      />
      <PaymentsCenter overview={overview} />
    </div>
  )
}
