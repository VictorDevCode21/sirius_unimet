'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, CalendarDays, CheckCircle2, Hash, LoaderCircle, Save, UserRound, UsersRound, XCircle } from 'lucide-react'
import { createSection, type SectionActionResult } from '@/control/controllers/section-management.controller'
import type { SectionFormOptions } from '@/control/controllers/section-management.queries'
import { MAX_SECTION_CAPACITY } from '@/domain/sections/section-rules'
import { toRoman } from '@/presentation/lib/format'

const selectClass = 'min-w-0 flex-1 cursor-pointer border-0 bg-transparent py-3.5 text-[0.95rem] text-foreground outline-0'
const inputClass = 'min-w-0 flex-1 border-0 bg-transparent py-3.5 text-[0.95rem] text-foreground outline-0'

// Form to create a section: term, subject, professor, capacity and optional number.
export function SectionForm({ options, defaultTermName }: { options: SectionFormOptions; defaultTermName?: string }) {
  const router = useRouter()
  const defaultTerm = options.terms.find((term) => term.name === defaultTermName) ?? options.terms.find((term) => term.open) ?? options.terms[0]
  const [termId, setTermId] = useState(defaultTerm.id)
  const [subjectId, setSubjectId] = useState('')
  const [professorId, setProfessorId] = useState('')
  const [capacity, setCapacity] = useState('30')
  const [number, setNumber] = useState('')
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<SectionActionResult | null>(null)

  const careers = [...new Set(options.subjects.map((subject) => subject.career))]

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setResult(null)
    try {
      const response = await createSection({ termId, subjectId, professorId, capacity, number })
      setResult(response)
      if (response.ok) {
        const termName = options.terms.find((term) => term.id === termId)?.name ?? ''
        router.push(`/department-head/sections?term=${encodeURIComponent(termName)}&created=${response.sectionId}`)
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="surface card-pad reveal reveal-1 grid max-w-3xl gap-5" onSubmit={submit} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          Período
          <span className="field">
            <CalendarDays aria-hidden="true" />
            <select className={selectClass} value={termId} onChange={(event) => setTermId(event.target.value)} required>
              {options.terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                  {term.open ? ' · pre-inscripción abierta' : ''}
                </option>
              ))}
            </select>
          </span>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-bold">
          Profesor
          <span className="field">
            <UserRound aria-hidden="true" />
            <select className={selectClass} value={professorId} onChange={(event) => setProfessorId(event.target.value)} required>
              <option value="" disabled>
                Elige un profesor
              </option>
              {options.professors.map((professor) => (
                <option key={professor.id} value={professor.id}>
                  {professor.name}
                </option>
              ))}
            </select>
          </span>
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-bold">
        Materia
        <span className="field">
          <BookOpen aria-hidden="true" />
          <select className={selectClass} value={subjectId} onChange={(event) => setSubjectId(event.target.value)} required>
            <option value="" disabled>
              Elige una materia
            </option>
            {careers.map((career) => (
              <optgroup key={career} label={career}>
                {options.subjects
                  .filter((subject) => subject.career === career)
                  .map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.code} · {subject.name} (Trimestre {toRoman(subject.term)}, {subject.credits} UC)
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </span>
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          Cupo
          <span className="field">
            <UsersRound aria-hidden="true" />
            <input
              className={inputClass}
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_SECTION_CAPACITY}
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              aria-describedby="capacity-help"
              required
            />
          </span>
          <small id="capacity-help" className="text-xs font-normal text-muted-foreground">
            Máximo de estudiantes, entre 1 y {MAX_SECTION_CAPACITY}.
          </small>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-bold">
          Número de sección (opcional)
          <span className="field">
            <Hash aria-hidden="true" />
            <input
              className={inputClass}
              type="number"
              inputMode="numeric"
              min={1}
              max={99}
              placeholder="Automático"
              value={number}
              onChange={(event) => setNumber(event.target.value)}
              aria-describedby="number-help"
            />
          </span>
          <small id="number-help" className="text-xs font-normal text-muted-foreground">
            Si lo dejas vacío se usa el siguiente número libre de la materia.
          </small>
        </label>
      </div>

      {result && (
        <p
          role={result.ok ? 'status' : 'alert'}
          className={`flex items-start gap-2 rounded-2xl p-4 text-sm font-semibold ${result.ok ? 'bg-[var(--status-passed-bg)] text-[var(--status-passed)]' : 'bg-red-500/10 text-red-700 dark:text-red-300'}`}
        >
          {result.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
          {result.message}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" className="secondary-button" onClick={() => router.push('/department-head/sections')}>
          Cancelar
        </button>
        <button type="submit" className="primary-button" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
          {pending ? 'Creando…' : 'Crear sección'}
        </button>
      </div>
    </form>
  )
}
