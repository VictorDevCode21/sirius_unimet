import { getDepartmentHeadSummary } from '@/control/controllers/department-head-context'
import { PortalShell } from '@/presentation/components/layout/portal-shell'

export default async function DepartmentHeadPortalLayout({ children }: { children: React.ReactNode }) {
  const summary = await getDepartmentHeadSummary()

  return (
    <PortalShell
      portal="department-head"
      user={summary.user}
      currentTermCode={summary.currentTermName}
      preEnrollmentTermCode={summary.openTermName}
      cartCount={0}
    >
      {children}
    </PortalShell>
  )
}
