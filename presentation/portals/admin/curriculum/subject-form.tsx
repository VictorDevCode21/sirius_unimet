'use client'

import { useEffect, useState } from 'react'
import { Hash, LoaderCircle, Plus, Type, X } from 'lucide-react'
import { registerSubject } from '@/control/controllers/curriculum.controller'
import { SUBJECT_CREDITS, SUBJECT_NAME_LENGTH, validateSubjectFields } from '@/domain/curriculum/subject-rules'
import { FormMessage } from '@/presentation/components/shared/form-message'
import { toRoman } from '@/presentation/lib/format'
import { useAction } from '@/presentation/lib/use-action'

const inputClass = 'min-w-0 flex-1 border-0 bg-transparent py-3.5 text-[0.95rem] text-foreground outline-0'

interface SubjectFormProps {
  careerId: string
  cell: { term: number; branch: number }
  onClose: () => void
}

// Dialog to register a subject in an empty cell of the curriculum grid.
export function SubjectForm({ careerId, cell, onClose }: SubjectFormProps) {
  const [form, setForm] = useState({ code: '', name: '', credits: '3' })
  const [errors, setErrors] = useState<string[]>([])
  const { pending, result, run } = useAction()

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const fieldErrors = validateSubjectFields({ ...cell, code: form.code.trim().toUpperCase(), name: form.name.trim(), credits: Number(form.credits) })
    setErrors(fieldErrors)
    if (fieldErrors.length) return
    const response = await run(() => registerSubject({ careerId, ...cell, ...form }))
    if (response?.ok) onClose()
  }

  const update = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
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
              Registrar materia
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
            <input className={inputClass} value={form.code} onChange={update('code')} placeholder="FPTSP07" maxLength={10} autoFocus required />
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
            {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Registrar materia
          </button>
        </div>
      </form>
    </div>
  )
}
