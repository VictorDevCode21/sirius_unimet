import Link from 'next/link'
import { Search } from 'lucide-react'
import { ROLE_OPTIONS } from '@/presentation/lib/roles'

// Search and role filter of the user list. A plain GET form keeps the filters in the URL.
export function UserFilters({ search, role }: { search: string; role: string }) {
  return (
    <form action="/admin/users" className="surface reveal reveal-1 mb-5 flex flex-col gap-3 p-4 md:flex-row md:items-center">
      <label className="search-box min-w-0 flex-1">
        <Search aria-hidden="true" />
        <input
          className="w-full min-w-0 border-0 bg-transparent text-sm text-foreground outline-0"
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Buscar por nombre o correo"
          aria-label="Buscar por nombre o correo"
        />
      </label>
      <select className="field cursor-pointer py-3 text-sm text-foreground" name="role" defaultValue={role} aria-label="Filtrar por rol">
        <option value="">Todos los roles</option>
        {ROLE_OPTIONS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-2">
        <button type="submit" className="primary-button">
          Buscar
        </button>
        {(search || role) && (
          <Link href="/admin/users" className="secondary-button">
            Limpiar
          </Link>
        )}
      </div>
    </form>
  )
}
