import { getAdminSummary } from '@/control/controllers/admin-context'
import { PortalShell } from '@/presentation/components/layout/portal-shell'

export default async function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  const summary = await getAdminSummary()

  return (
    <PortalShell
      portal="admin"
      user={summary.user}
      currentTermCode={summary.currentTermName}
      preEnrollmentTermCode={summary.openTermName}
      cartCount={0}
    >
      {children}
    </PortalShell>
  )
}
