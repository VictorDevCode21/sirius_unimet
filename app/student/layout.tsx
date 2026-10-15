import { getPortalSummary } from '@/control/controllers/student-context'
import { PortalShell } from '@/presentation/components/layout/portal-shell'

export default async function StudentPortalLayout({ children }: { children: React.ReactNode }) {
  const summary = await getPortalSummary()

  return (
    <PortalShell
      user={summary.user}
      currentTermCode={summary.currentTermName}
      preEnrollmentTermCode={summary.openTermName}
      cartCount={summary.selectedSections}
    >
      {children}
    </PortalShell>
  )
}
