import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getUsers } from '@/control/controllers/user.queries'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { UserFilters } from '@/presentation/portals/admin/users/user-filters'
import { UsersList } from '@/presentation/portals/admin/users/users-list'

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string }> }) {
  const { users, filters } = await getUsers(await searchParams)

  return (
    <div className="content-container">
      <PageHeading
        eyebrow="Administración"
        title="Usuarios"
        description="Registra las cuentas del sistema y asigna el rol de cada persona."
        actions={
          <Link href="/admin/users/new" className="primary-button">
            <Plus className="h-4 w-4" aria-hidden="true" /> Crear usuario
          </Link>
        }
      />
      <UserFilters search={filters.search ?? ''} role={filters.role ?? ''} />
      <UsersList users={users} />
    </div>
  )
}
