import type { CourseOutcome } from '@/domain/grades/course-outcome'
import { cn } from '@/presentation/lib/utils'

// Result of a saved grade.
export function GradeOutcomeBadge({ outcome }: { outcome: CourseOutcome }) {
  return (
    <span className={cn('pill', outcome === 'FAILED' && 'text-red-600 dark:text-red-400')}>{outcome === 'PASSED' ? 'Aprobada' : 'Reprobada'}</span>
  )
}
