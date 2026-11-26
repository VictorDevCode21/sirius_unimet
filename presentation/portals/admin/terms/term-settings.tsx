'use client'

import type { TermView } from '@/control/controllers/term.queries'
import { saveMaxCredits, saveRatePerCredit } from '@/control/controllers/term.controller'
import { TermSettingForm } from '@/presentation/portals/admin/terms/term-setting-form'

// Editable settings of a period.
export function TermSettings({ term }: { term: TermView }) {
  return (
    <div className="section-grid grid md:grid-cols-2">
      <TermSettingForm
        title="Monto por UC"
        description="Se usa en todos los cálculos del periodo. Las inscripciones ya pagadas conservan el monto con el que se pagaron."
        label="Monto por UC (USD)"
        initialValue={term.ratePerCredit > 0 ? String(term.ratePerCredit) : ''}
        inputMode="decimal"
        save={(ratePerCredit) => saveRatePerCredit({ termId: term.id, ratePerCredit })}
      />
      <TermSettingForm
        title="Máximo de UC"
        description="Ninguna inscripción del periodo podrá superar este límite."
        label="Máximo de UC por trimestre"
        initialValue={term.maxCredits > 0 ? String(term.maxCredits) : ''}
        inputMode="numeric"
        save={(maxCredits) => saveMaxCredits({ termId: term.id, maxCredits })}
      />
    </div>
  )
}
