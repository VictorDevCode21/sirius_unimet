import type { CourseOutcome } from '@/domain/grades/course-outcome'
import { cn } from '@/presentation/lib/utils'

// Result of a saved grade.
export function GradeOutcomeBadge({ outcome }: { outcome: CourseOutcome }) {
  return (
    <span className={cn('pill', outcome === 'FAILED' && 'text-[var(--status-failed)]')}>{outcome === 'PASSED' ? 'Aprobada' : 'Reprobada'}</span>
  )
}
