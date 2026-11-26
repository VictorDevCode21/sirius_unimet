import { getProfessorContext } from '@/control/controllers/professor-context'
import { PortalShell } from '@/presentation/components/layout/portal-shell'

export default async function ProfessorPortalLayout({ children }: { children: React.ReactNode }) {
  const { user, term } = await getProfessorContext()

  return (
    <PortalShell portal="professor" user={user} currentTermCode={term?.name ?? null} preEnrollmentTermCode={null} cartCount={0}>
      {children}
    </PortalShell>
  )
}
