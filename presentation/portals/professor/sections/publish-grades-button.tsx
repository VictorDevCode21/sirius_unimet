'use client'

import { LoaderCircle, Send } from 'lucide-react'
import { publishGrades } from '@/control/controllers/grade.controller'
import { FormMessage } from '@/presentation/components/shared/form-message'
import { useAction } from '@/presentation/lib/use-action'

// Publishes the grades of the section so students can see them.
export function PublishGradesButton({ sectionId }: { sectionId: string }) {
  const { pending, result, run } = useAction()

  return (
    <div className="surface mt-5 flex flex-col gap-3 p-5">
      <p className="text-sm text-muted-foreground">Los estudiantes verán sus notas en el histórico cuando las publiques.</p>
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" className="primary-button" disabled={pending} onClick={() => run(() => publishGrades(sectionId))}>
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" aria-hidden="true" />}
          Publicar notas
        </button>
        <FormMessage result={result} />
      </div>
    </div>
  )
}
