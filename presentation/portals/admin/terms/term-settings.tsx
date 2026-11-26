'use client'

import type { TermView } from '@/control/controllers/term.queries'
import { saveEnrollmentStart, saveMaxCredits, saveRatePerCredit } from '@/control/controllers/term.controller'
import { TermSettingForm } from '@/presentation/portals/admin/terms/term-setting-form'

// Editable settings of a period.
export function TermSettings({ term }: { term: TermView }) {
  return (
    <div className="section-grid grid md:grid-cols-2">
      <TermSettingForm
        title="Costo de matrícula (monto por UC)"
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
      <TermSettingForm
        title="Inscripción por turnos"
        description="Primer día de inscripción. La inscripción dura dos días, de 7:00 a 17:00 (hora de Caracas); cada estudiante inscribe desde la hora de su turno, asignada por IAA y promedio del último trimestre. Los estudiantes de primer trimestre inscriben en la primera hora."
        label="Primer día de inscripción"
        initialValue={term.enrollmentStartsAt ? new Date(term.enrollmentStartsAt).toISOString().slice(0, 10) : ''}
        inputMode="numeric"
        type="date"
        save={(enrollmentStartsAt) => saveEnrollmentStart({ termId: term.id, enrollmentStartsAt })}
      />
    </div>
  )
}
