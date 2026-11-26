import Link from 'next/link'
import { Pencil } from 'lucide-react'
import type { UserRow } from '@/control/controllers/user.queries'
import { ROLE_LABELS } from '@/presentation/lib/roles'

// List of users with their role, career and status.
export function UsersList({ users }: { users: UserRow[] }) {
  if (!users.length) {
    return <p className="surface card-pad text-center text-sm text-muted-foreground">No se encontraron usuarios</p>
  }

  return (
    <ul className="flex flex-col gap-3">
      {users.map((user) => (
        <li key={user.id} className="surface flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-bold [overflow-wrap:anywhere]">{user.name}</p>
            <p className="mt-0.5 text-sm text-muted-foreground [overflow-wrap:anywhere]">{user.email}</p>
            {user.career && <p className="mt-0.5 text-xs text-muted-foreground">{user.career.name}</p>}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span className="pill">{ROLE_LABELS[user.role]}</span>
            {!user.active && <span className="pill">Inactivo</span>}
            <Link href={`/admin/users/${user.id}`} className="secondary-button">
              <Pencil className="h-4 w-4" aria-hidden="true" /> Editar
            </Link>
          </div>
        </li>
      ))}
    </ul>
  )
}
