'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileUp, GraduationCap, Plus } from 'lucide-react'
import type { CurriculumEditor } from '@/control/controllers/curriculum.queries'
import { RequirementsForm } from '@/presentation/portals/admin/curriculum/requirements-form'
import { SubjectForm } from '@/presentation/portals/admin/curriculum/subject-form'
import { toRoman } from '@/presentation/lib/format'

interface CurriculumGridProps extends CurriculumEditor {
  terms: number
  branches: number
}

// Curriculum grid of a career: one column per term and one row per branch; empty cells register a subject.
export function CurriculumGrid({ careers, career, subjects, terms, branches }: CurriculumGridProps) {
  const router = useRouter()
  const [cell, setCell] = useState<{ term: number; branch: number } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showRequirements, setShowRequirements] = useState(false)
  const editing = subjects.find((subject) => subject.id === editingId) ?? null
  const closeEditor = () => {
    setEditingId(null)
    setShowRequirements(false)
  }
  const cellMap = new Map(subjects.map((subject) => [`${subject.term}-${subject.branch}`, subject]))
  const totalCredits = subjects.reduce((sum, subject) => sum + subject.credits, 0)

  if (!career) {
    return <p className="surface card-pad text-center text-sm text-muted-foreground">Registra una carrera antes de cargar su pensum.</p>
  }

  return (
    <>
      <section className="surface reveal reveal-1 overflow-hidden" aria-labelledby="curriculum-title">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 id="curriculum-title" className="text-lg font-bold">
              Pensum de {career.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {subjects.length} materias · {totalCredits} UC. Selecciona una celda vacía para registrar una materia o una materia para editarla y moverla.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Link href={`/admin/curriculum/import?career=${career.id}`} className="secondary-button shrink-0">
              <FileUp aria-hidden="true" /> Importar CSV
            </Link>
            <label className="flex min-w-0 flex-col gap-1.5 text-sm font-bold lg:w-80">
              Carrera
              <span className="field">
                <GraduationCap aria-hidden="true" />
                <select
                  className="min-w-0 flex-1 border-0 bg-transparent py-3.5 text-[0.95rem] text-foreground outline-0"
                  value={career.id}
                  onChange={(event) => router.push(`/admin/curriculum?career=${event.target.value}`)}
                >
                  {careers.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </span>
            </label>
          </div>
        </div>

        <div className="overflow-x-auto p-4 sm:p-6" style={{ scrollbarWidth: 'thin' }}>
          <div className="flow-board min-w-max" style={{ '--periods': terms } as React.CSSProperties}>
            {Array.from({ length: terms }, (_, index) => (
              <div key={`head-${index}`} className="flow-period-head">
                <strong>{toRoman(index + 1)}</strong>
                <small>TRIMESTRE</small>
              </div>
            ))}
            {Array.from({ length: branches }, (_, rowIndex) =>
              Array.from({ length: terms }, (_, termIndex) => {
                const term = termIndex + 1
                const branch = rowIndex + 1
                const subject = cellMap.get(`${term}-${branch}`)
                if (subject) {
                  return (
                    <button
                      key={subject.id}
                      type="button"
                      className="subject-card border-border bg-card hover:border-[var(--brand-sky)]"
                      aria-label={`Editar ${subject.name} (${subject.code})`}
                      onClick={() => setEditingId(subject.id)}
                    >
                      <span className="subject-code">{subject.code}</span>
                      <p className="mt-2 line-clamp-3 text-[0.8rem] font-semibold leading-tight">{subject.name}</p>
                      <span className="mt-auto flex justify-between gap-2 pt-3 text-[0.66rem] font-semibold opacity-70">
                        <span>{subject.credits} UC</span>
                        {(subject.prerequisiteIds.length > 0 || subject.minCredits) && (
                          <span>
                            {[subject.prerequisiteIds.length ? `${subject.prerequisiteIds.length} prel.` : null, subject.minCredits ? `${subject.minCredits} UC mín.` : null]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        )}
                      </span>
                    </button>
                  )
                }
                return (
                  <button
                    key={`empty-${term}-${branch}`}
                    type="button"
                    className="flex min-h-[var(--subject-card-height)] items-center justify-center rounded-[var(--card-radius-sm)] border border-dashed border-border text-muted-foreground transition hover:border-[var(--brand-sky)] hover:text-[var(--brand-sky)] focus-visible:border-[var(--brand-sky)]"
                    aria-label={`Registrar materia en el trimestre ${term}, rama ${branch}`}
                    onClick={() => setCell({ term, branch })}
                  >
                    <Plus className="h-5 w-5" aria-hidden="true" />
                  </button>
                )
              }),
            )}
          </div>
        </div>
      </section>

      {cell && <SubjectForm careerId={career.id} cell={cell} onClose={() => setCell(null)} />}
      {editing && !showRequirements && (
        <SubjectForm
          key={editing.id}
          careerId={career.id}
          cell={{ term: editing.term, branch: editing.branch }}
          subject={editing}
          onShowRequirements={() => setShowRequirements(true)}
          onClose={closeEditor}
        />
      )}
      {editing && showRequirements && (
        <RequirementsForm key={editing.id} subject={editing} subjects={subjects} onBack={() => setShowRequirements(false)} onClose={closeEditor} />
      )}
    </>
  )
}
