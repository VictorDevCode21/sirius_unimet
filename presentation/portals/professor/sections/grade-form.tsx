'use client'

import { useState } from 'react'
import { LoaderCircle, Save } from 'lucide-react'
import { correctGrade, saveGrade } from '@/control/controllers/grade.controller'
import { FormMessage } from '@/presentation/components/shared/form-message'
import { useAction } from '@/presentation/lib/use-action'

interface GradeFormProps {
  sectionId: string
  studentId: string
  studentName: string
  grade: number | null
  mode?: 'professor' | 'admin'
}

// Final grade input of a student, used by the professor and by the admin correction. The value travels as text so
// the server validates it.
export function GradeForm({ sectionId, studentId, studentName, grade, mode = 'professor' }: GradeFormProps) {
  const [value, setValue] = useState(grade === null ? '' : String(grade))
  const { pending, result, run } = useAction()

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const save = mode === 'admin' ? correctGrade : saveGrade
    run(() => save({ sectionId, studentId, value }))
  }

  return (
    <form className="flex shrink-0 flex-col gap-2 md:items-end" onSubmit={submit} noValidate>
      <div className="flex items-center gap-2">
        <span className="field w-24">
          <input
            className="w-full min-w-0 border-0 bg-transparent py-3 text-center text-[0.95rem] font-bold text-foreground outline-0"
            inputMode="numeric"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="0–20"
            aria-label={`Nota de ${studentName}`}
          />
        </span>
        <button type="submit" className="secondary-button" disabled={pending}>
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          Guardar
        </button>
      </div>
      <FormMessage result={result} />
    </form>
  )
}
