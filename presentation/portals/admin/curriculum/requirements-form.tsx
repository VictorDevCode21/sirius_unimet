'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Hash, LoaderCircle, Save, Search, X } from 'lucide-react'
import { defineRequirements } from '@/control/controllers/curriculum.controller'
import type { EditorSubject } from '@/control/controllers/curriculum.queries'
import { validateRequirements } from '@/domain/curriculum/prerequisite-rules'
import { FormMessage } from '@/presentation/components/shared/form-message'
import { toRoman } from '@/presentation/lib/format'
import { useAction } from '@/presentation/lib/use-action'

const inputClass = 'min-w-0 flex-1 border-0 bg-transparent py-3 text-[0.95rem] text-foreground outline-0'

interface RequirementsFormProps {
  subject: EditorSubject
  subjects: EditorSubject[]
  onBack: () => void
  onClose: () => void
}

// Dialog to choose the subjects a subject requires, its minimum passed credits and its credit alternative.
export function RequirementsForm({ subject, subjects, onBack, onClose }: RequirementsFormProps) {
  const [selected, setSelected] = useState(() => new Set(subject.prerequisiteIds))
  const [query, setQuery] = useState('')
  const [form, setForm] = useState({
    minCredits: subject.minCredits === null ? '' : String(subject.minCredits),
    alternativeCredits: subject.alternativeCredits === null ? '' : String(subject.alternativeCredits),
    alternativeCreditBlock: subject.alternativeCreditBlock ?? '',
  })
  const [errors, setErrors] = useState<string[]>([])
  const { pending, result, run } = useAction()

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const candidates = useMemo(() => {
    const text = query.trim().toLowerCase()
    return subjects
      .filter((other) => other.id !== subject.id && (other.term < subject.term || selected.has(other.id)))
      .filter((other) => !text || other.code.toLowerCase().includes(text) || other.name.toLowerCase().includes(text))
      .sort((a, b) => b.term - a.term || a.branch - b.branch)
  }, [subjects, subject.id, subject.term, selected, query])

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const update = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [field]: event.target.value }))

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const toNumber = (value: string) => (value.trim() ? Number(value) : null)
    const draftErrors = validateRequirements(subjects, subject.id, {
      requirementIds: [...selected],
      minCredits: toNumber(form.minCredits),
      alternativeCredits: toNumber(form.alternativeCredits),
      alternativeCreditBlock: form.alternativeCreditBlock.trim().toUpperCase() || null,
    })
    setErrors(draftErrors)
    if (draftErrors.length) return
    run(() => defineRequirements({ subjectId: subject.id, requirementIds: [...selected], ...form }))
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <form
        className="detail-drawer gap-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="requirements-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={submit}
        noValidate
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {subject.code} · Trimestre {toRoman(subject.term)}
            </p>
            <h2 id="requirements-title" className="mt-2 font-display text-3xl font-extrabold uppercase leading-[0.95]">
              Prelaciones
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{subject.name}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="icon-button" onClick={onBack} aria-label="Volver a los datos de la materia">
              <ArrowLeft />
            </button>
            <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar">
              <X />
            </button>
          </div>
        </div>

        <fieldset className="flex min-h-0 flex-col gap-2">
          <legend className="mb-1.5 text-sm font-bold">
            Materias requisito <span className="font-semibold text-muted-foreground">({selected.size} seleccionadas)</span>
          </legend>
          <span className="field">
            <Search aria-hidden="true" />
            <input className={inputClass} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por código o nombre" aria-label="Buscar materia requisito" />
          </span>
          {candidates.length ? (
            <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto pr-1">
              {candidates.map((other) => (
                <li key={other.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-sm hover:bg-muted">
                    <input type="checkbox" className="h-4 w-4 accent-[var(--brand-blue)]" checked={selected.has(other.id)} onChange={() => toggle(other.id)} />
                    <span className="font-mono text-[0.7rem] font-bold text-muted-foreground">{toRoman(other.term)}</span>
                    <span className="min-w-0 flex-1 truncate">
                      {other.name} <span className="text-muted-foreground">({other.code})</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {subject.term === 1 ? 'Las materias del primer trimestre no tienen prelaciones.' : 'No hay materias que coincidan.'}
            </p>
          )}
        </fieldset>

        <label className="flex min-w-0 flex-col gap-1.5 text-sm font-bold">
          UC mínimas aprobadas
          <span className="field">
            <Hash aria-hidden="true" />
            <input className={inputClass} type="number" inputMode="numeric" min={0} value={form.minCredits} onChange={update('minCredits')} placeholder="Sin mínimo" />
          </span>
        </label>

        <fieldset className="grid grid-cols-2 gap-3">
          <legend className="mb-1.5 text-sm font-bold">
            Alternativa <span className="font-semibold text-muted-foreground">(ó: reemplaza los requisitos)</span>
          </legend>
          <label className="flex min-w-0 flex-col gap-1.5 text-xs font-bold text-muted-foreground">
            UC aprobadas
            <span className="field">
              <input className={inputClass} type="number" inputMode="numeric" min={1} value={form.alternativeCredits} onChange={update('alternativeCredits')} placeholder="57" />
            </span>
          </label>
          <label className="flex min-w-0 flex-col gap-1.5 text-xs font-bold text-muted-foreground">
            Del bloque
            <span className="field">
              <input className={inputClass} value={form.alternativeCreditBlock} onChange={update('alternativeCreditBlock')} placeholder="BP" maxLength={6} />
            </span>
          </label>
        </fieldset>

        <div className="mt-auto flex flex-col gap-3 pt-2">
          {errors.length > 0 && (
            <ul role="alert" className="flex flex-col gap-1 text-sm font-semibold text-red-600 dark:text-red-400">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
          <FormMessage result={result} />
          <button type="submit" className="primary-button w-full" disabled={pending}>
            {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar prelaciones
          </button>
        </div>
      </form>
    </div>
  )
}
