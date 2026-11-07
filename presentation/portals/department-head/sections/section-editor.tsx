'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Hash, LoaderCircle, Save, Trash2, UserRound, UsersRound, XCircle } from 'lucide-react'
import { deleteSection, updateSection, type SectionActionResult } from '@/control/controllers/section-management.controller'
import type { ManagedSectionDetail } from '@/control/controllers/section-management.queries'
import { MAX_SECTION_CAPACITY } from '@/domain/sections/section-rules'

const fieldClass = 'min-w-0 flex-1 border-0 bg-transparent py-3.5 text-[0.95rem] text-foreground outline-0 disabled:cursor-not-allowed'

export function ActionMessage({ result }: { result: SectionActionResult | null }) {
  if (!result) return null
  return (
    <p
      role={result.ok ? 'status' : 'alert'}
      className={`flex items-start gap-2 rounded-2xl p-4 text-sm font-semibold ${result.ok ? 'bg-[var(--status-passed-bg)] text-[var(--status-passed)]' : 'bg-red-500/10 text-red-700 dark:text-red-300'}`}
    >
      {result.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
      {result.message}
    </p>
  )
}

// Edits professor, capacity and number of a section and deletes it when it has no enrolled students.
export function SectionEditor({ detail, backHref }: { detail: ManagedSectionDetail; backHref: string }) {
  const router = useRouter()
  const { section, professors } = detail
  const editable = section.term.editable
  const [professorId, setProfessorId] = useState(section.professor.id)
  const [capacity, setCapacity] = useState(String(section.capacity))
  const [number, setNumber] = useState(String(section.number))
  const [pending, setPending] = useState<'save' | 'delete' | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [result, setResult] = useState<SectionActionResult | null>(null)
  const professorListed = professors.some((professor) => professor.id === section.professor.id)

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return
    setPending('save')
    setResult(null)
    try {
      const response = await updateSection({ sectionId: section.id, professorId, capacity, number })
      setResult(response)
      if (response.ok) router.refresh()
    } finally {
      setPending(null)
    }
  }

  const remove = async () => {
    if (pending) return
    setPending('delete')
    setResult(null)
    try {
      const response = await deleteSection(section.id)
      setResult(response)
      setConfirmingDelete(false)
      if (response.ok) router.push(`${backHref}&deleted=1`)
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="section-grid grid xl:grid-cols-[minmax(0,1fr)_20rem]">
      <form className="surface card-pad reveal reveal-1 grid h-fit gap-5" onSubmit={save} noValidate>
        <h2 className="text-lg font-bold">Datos de la sección</h2>
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          Profesor
          <span className="field">
            <UserRound aria-hidden="true" />
            <select className={`${fieldClass} cursor-pointer`} value={professorId} onChange={(event) => setProfessorId(event.target.value)} disabled={!editable}>
              {!professorListed && <option value={section.professor.id}>{section.professor.name} (inactivo)</option>}
              {professors.map((professor) => (
                <option key={professor.id} value={professor.id}>
                  {professor.name}
                </option>
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
                className={fieldClass}
                type="number"
                inputMode="numeric"
                min={Math.max(1, section.occupied)}
                max={MAX_SECTION_CAPACITY}
                value={capacity}
                onChange={(event) => setCapacity(event.target.value)}
                disabled={!editable}
                aria-describedby="edit-capacity-help"
              />
            </span>
            <small id="edit-capacity-help" className="text-xs font-normal text-muted-foreground">
              {section.occupied > 0 ? `No puede ser menor que los ${section.occupied} inscritos.` : `Entre 1 y ${MAX_SECTION_CAPACITY}.`}
            </small>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            Número de sección
            <span className="field">
              <Hash aria-hidden="true" />
              <input
                className={fieldClass}
                type="number"
                inputMode="numeric"
                min={1}
                max={99}
                value={number}
                onChange={(event) => setNumber(event.target.value)}
                disabled={!editable}
              />
            </span>
          </label>
        </div>

        <ActionMessage result={result} />

        {editable && (
          <div className="flex justify-end">
            <button type="submit" className="primary-button" disabled={pending !== null}>
              {pending === 'save' ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
              {pending === 'save' ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        )}
      </form>

      <aside className="surface card-pad reveal reveal-2 h-fit">
        <h2 className="text-lg font-bold">Eliminar sección</h2>
        {section.occupied > 0 || section.grades > 0 ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            No se puede eliminar porque tiene{' '}
            {section.occupied > 0 ? `${section.occupied} ${section.occupied === 1 ? 'estudiante inscrito' : 'estudiantes inscritos'}` : 'calificaciones registradas'}
            . Así se conservan las inscripciones y el histórico.
          </p>
        ) : !editable ? (
          <p className="mt-2 text-sm text-muted-foreground">Las secciones de períodos finalizados no se pueden eliminar.</p>
        ) : confirmingDelete ? (
          <div className="mt-3 rounded-2xl bg-red-500/10 p-4" role="group" aria-label="Confirmar eliminación">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
              Se eliminará la sección {section.number} y su horario. Esta acción no se puede deshacer.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="secondary-button !py-2" onClick={() => setConfirmingDelete(false)} disabled={pending !== null}>
                Cancelar
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-red-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:opacity-60"
                onClick={remove}
                disabled={pending !== null}
              >
                {pending === 'delete' ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                Sí, eliminar
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">La sección no tiene inscritos. Al eliminarla también se borra su horario.</p>
            <button type="button" className="secondary-button mt-4 !text-red-700 dark:!text-red-300" onClick={() => setConfirmingDelete(true)}>
              <Trash2 aria-hidden="true" /> Eliminar sección
            </button>
          </>
        )}
      </aside>
    </div>
  )
}
