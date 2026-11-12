'use client'

import { useEffect, useState } from 'react'
import { GitBranch, Hash, LoaderCircle, Move, Plus, Save, Type, X } from 'lucide-react'
import { editSubject, registerSubject } from '@/control/controllers/curriculum.controller'
import type { EditorSubject } from '@/control/controllers/curriculum.queries'
import { CURRICULUM_BRANCHES, CURRICULUM_TERMS } from '@/domain/curriculum/curriculum-grid'
import { SUBJECT_CREDITS, SUBJECT_NAME_LENGTH, validateSubjectFields } from '@/domain/curriculum/subject-rules'
import { FormMessage } from '@/presentation/components/shared/form-message'
import { toRoman } from '@/presentation/lib/format'
import { useAction } from '@/presentation/lib/use-action'

const inputClass = 'min-w-0 flex-1 border-0 bg-transparent py-3.5 text-[0.95rem] text-foreground outline-0'

const selectClass = 'min-w-0 flex-1 border-0 bg-transparent py-3.5 text-[0.95rem] text-foreground outline-0'

interface SubjectFormProps {
  careerId: string
  cell: { term: number; branch: number }
  subject?: EditorSubject
  onShowRequirements?: () => void
  onClose: () => void
}

// Dialog to register a subject in an empty cell of the grid, or to edit a subject and move it to another cell.
export function SubjectForm({ careerId, cell, subject, onShowRequirements, onClose }: SubjectFormProps) {
  const [form, setForm] = useState({
    code: subject?.code ?? '',
    name: subject?.name ?? '',
    credits: String(subject?.credits ?? 3),
    term: String(cell.term),
    branch: String(cell.branch),
  })
  const [errors, setErrors] = useState<string[]>([])
  const { pending, result, run } = useAction()

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const fieldErrors = validateSubjectFields({
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      credits: Number(form.credits),
      term: Number(form.term),
      branch: Number(form.branch),
    })
    setErrors(fieldErrors)
    if (fieldErrors.length) return
    const response = await run(() => (subject ? editSubject({ subjectId: subject.id, ...form }) : registerSubject({ careerId, ...form })))
    if (response?.ok) onClose()
  }

  const update = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((current) => ({ ...current, [field]: event.target.value }))

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <form
        className="detail-drawer gap-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="subject-form-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={submit}
        noValidate
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Trimestre {toRoman(cell.term)} · Rama {cell.branch}
            </p>
            <h2 id="subject-form-title" className="mt-2 font-display text-3xl font-extrabold uppercase leading-[0.95]">
              {subject ? 'Editar materia' : 'Registrar materia'}
            </h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar">
            <X />
          </button>
        </div>

        <label className="flex min-w-0 flex-col gap-1.5 text-sm font-bold">
          Código
          <span className="field">
            <Hash aria-hidden="true" />
            <input className={inputClass} value={form.code} onChange={update('code')} placeholder="FPTSP07" maxLength={10} autoFocus={!subject} required />
          </span>
        </label>
        <label className="flex min-w-0 flex-col gap-1.5 text-sm font-bold">
          Nombre
          <span className="field">
            <Type aria-hidden="true" />
            <input
              className={inputClass}
              value={form.name}
              onChange={update('name')}
              placeholder="Ingeniería de Software"
              maxLength={SUBJECT_NAME_LENGTH.max}
              required
            />
          </span>
        </label>
        <label className="flex min-w-0 flex-col gap-1.5 text-sm font-bold">
          Unidades de crédito (UC)
          <span className="field">
            <Hash aria-hidden="true" />
            <input className={inputClass} type="number" inputMode="numeric" min={SUBJECT_CREDITS.min} max={SUBJECT_CREDITS.max} value={form.credits} onChange={update('credits')} required />
          </span>
        </label>

        {subject && (
          <fieldset className="grid grid-cols-2 gap-3">
            <legend className="mb-1.5 flex items-center gap-1.5 text-sm font-bold">
              <Move className="h-4 w-4" aria-hidden="true" /> Ubicación en el pensum
            </legend>
            <label className="flex min-w-0 flex-col gap-1.5 text-xs font-bold text-muted-foreground">
              Trimestre
              <span className="field">
                <select className={selectClass} value={form.term} onChange={update('term')}>
                  {Array.from({ length: CURRICULUM_TERMS }, (_, index) => (
                    <option key={index} value={index + 1}>
                      {toRoman(index + 1)}
                    </option>
                  ))}
                </select>
              </span>
            </label>
            <label className="flex min-w-0 flex-col gap-1.5 text-xs font-bold text-muted-foreground">
              Rama
              <span className="field">
                <select className={selectClass} value={form.branch} onChange={update('branch')}>
                  {Array.from({ length: CURRICULUM_BRANCHES }, (_, index) => (
                    <option key={index} value={index + 1}>
                      {index + 1}
                    </option>
                  ))}
                </select>
              </span>
            </label>
          </fieldset>
        )}

        {subject && onShowRequirements && (
          <button type="button" className="secondary-button w-full" onClick={onShowRequirements}>
            <GitBranch aria-hidden="true" /> Prelaciones y UC mínimas ({subject.prerequisiteIds.length})
          </button>
        )}

        <div className="mt-auto flex flex-col gap-3 pt-4">
          {errors.length > 0 && (
            <ul role="alert" className="flex flex-col gap-1 text-sm font-semibold text-red-600 dark:text-red-400">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
          <FormMessage result={result} />
          <button type="submit" className="primary-button w-full" disabled={pending}>
            {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : subject ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {subject ? 'Guardar cambios' : 'Registrar materia'}
          </button>
        </div>
      </form>
    </div>
  )
}
