import { Check, Clock3, LockKeyhole, Sparkles } from 'lucide-react'
import type { SubjectStatus } from '@/domain/prerequisites/prerequisite-engine'

export const statusConfig: Record<SubjectStatus, { label: string; icon: typeof Check; color: string }> = {
  PASSED: { label: 'Aprobada', icon: Check, color: 'var(--status-passed)' },
  IN_PROGRESS: { label: 'En curso', icon: Clock3, color: 'var(--status-progress)' },
  AVAILABLE: { label: 'Disponible', icon: Sparkles, color: 'var(--brand-orange)' },
  BLOCKED: { label: 'Bloqueada', icon: LockKeyhole, color: 'var(--status-blocked)' },
}

export function StatusBadge({ status }: { status: SubjectStatus }) {
  const { label, icon: Icon } = statusConfig[status]
  return (
    <span className={`status-badge status-${status}`}>
      <Icon aria-hidden="true" />
      {label}
    </span>
  )
}
