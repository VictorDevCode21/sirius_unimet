'use client'

import type { TermView } from '@/control/controllers/term.queries'
import { saveRatePerCredit } from '@/control/controllers/term.controller'
import { formatDateOnly } from '@/presentation/lib/format'
import { TermSettingForm } from '@/presentation/portals/admin/terms/term-setting-form'

// Rate per credit of every period, each with its own form.
export function TuitionList({ terms }: { terms: TermView[] }) {
  if (!terms.length) {
    return <p className="surface card-pad text-center text-sm text-muted-foreground">Aún no hay periodos registrados. Crea uno en Periodos.</p>
  }

  return (
    <div className="section-grid grid md:grid-cols-2">
      {terms.map((term) => (
        <TermSettingForm
          key={term.id}
          title={`${term.name}${term.open ? ' · Abierto' : ''}`}
          description={`${formatDateOnly(term.startsAt)} – ${formatDateOnly(term.endsAt)}`}
          label="Monto por UC (USD)"
          initialValue={term.ratePerCredit > 0 ? String(term.ratePerCredit) : ''}
          inputMode="decimal"
          save={(ratePerCredit) => saveRatePerCredit({ termId: term.id, ratePerCredit })}
        />
      ))}
    </div>
  )
}
