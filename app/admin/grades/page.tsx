import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getCorrectableSections } from '@/control/controllers/grade-correction.queries'
import { PageHeading } from '@/presentation/components/shared/page-heading'

export default async function GradeCorrectionPage({ searchParams }: { searchParams: Promise<{ term?: string }> }) {
  const { term } = await searchParams
  const { termNames, termName, sections } = await getCorrectableSections(term)

  return (
    <div className="content-container">
      <PageHeading eyebrow="Administración" title="Notas" description="Corrige las notas que un profesor ya publicó. El flujograma del estudiante se actualiza con el nuevo valor." />

      <form action="/admin/grades" className="surface reveal reveal-1 mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <select className="field min-w-0 flex-1 cursor-pointer py-3 text-sm text-foreground" name="term" defaultValue={termName ?? ''} aria-label="Periodo">
          {termNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <button type="submit" className="primary-button">
          Ver periodo
        </button>
      </form>

      {sections.length ? (
        <ul className="flex flex-col gap-3">
          {sections.map((section) => (
            <li key={section.id}>
              <Link href={`/admin/grades/${section.id}`} className="surface flex items-center justify-between gap-4 p-5">
                <span className="min-w-0">
                  <span className="block font-bold">
                    {section.subject.name} · Sección {section.number}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {section.professor.name} · {section._count.grades} {section._count.grades === 1 ? 'nota publicada' : 'notas publicadas'}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="surface card-pad text-center text-sm text-muted-foreground">Este periodo no tiene notas publicadas.</p>
      )}
    </div>
  )
}
