'use client'

import { useRouter } from 'next/navigation'
import { CalendarDays } from 'lucide-react'
import type { TermOption } from '@/control/controllers/section-management.queries'

// Term selector that reloads the section list for the chosen term.
export function TermFilter({ terms, selected }: { terms: TermOption[]; selected: string | null }) {
  const router = useRouter()

  return (
    <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-foreground">
      Período
      <span className="field !rounded-full !px-4">
        <CalendarDays aria-hidden="true" />
        <select
          className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent py-2.5 text-sm font-semibold text-foreground outline-0"
          value={selected ?? ''}
          onChange={(event) => router.push(`/department-head/sections?term=${encodeURIComponent(event.target.value)}`)}
        >
          {terms.map((term) => (
            <option key={term.id} value={term.name}>
              {term.name}
              {term.open ? ' · pre-inscripción abierta' : term.editable ? '' : ' · finalizado'}
            </option>
          ))}
        </select>
      </span>
    </label>
  )
}
