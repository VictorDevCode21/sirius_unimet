'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, CircleSlash, X } from 'lucide-react'
import type { FlowchartSubject } from '@/control/controllers/flowchart.controller'
import { StatusBadge } from '@/presentation/components/shared/status-badge'
import { toRoman } from '@/presentation/lib/format'

interface SubjectDrawerProps {
  subject: FlowchartSubject
  onClose: () => void
  showEnrollLink?: boolean
}

export function SubjectDrawer({ subject, onClose, showEnrollLink = true }: SubjectDrawerProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="detail-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="subject-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <StatusBadge status={subject.status} />
            <h2 id="subject-detail-title" className="mt-4 font-display text-3xl font-extrabold uppercase leading-[0.95]">
              {subject.name}
            </h2>
            <p className="mt-2 font-mono text-xs font-bold text-muted-foreground">{subject.code}</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar detalle">
            <X />
          </button>
        </div>

        <div className="mt-7 grid grid-cols-3 gap-3">
          <div className="detail-stat">
            <span>UC</span>
            <strong>{subject.credits}</strong>
          </div>
          <div className="detail-stat">
            <span>Trimestre</span>
            <strong>{toRoman(subject.term)}</strong>
          </div>
          <div className="detail-stat">
            <span>Rama</span>
            <strong>{subject.branch}</strong>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-bold">Prelaciones</h3>
          {subject.requirements.length ? (
            <div className="mt-3 flex flex-col gap-2">
              {subject.requirements.map((requirement, index) => (
                <div key={requirement.label}>
                  {requirement.isAlternative && index > 0 && (
                    <p className="flex items-center gap-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">
                      <span className="h-px flex-1 bg-border" /> ó <span className="h-px flex-1 bg-border" />
                    </p>
                  )}
                  <div className="requirement-row">
                    {requirement.met ? (
                      <Check className="text-[var(--status-passed)]" />
                    ) : (
                      <CircleSlash className="text-[var(--status-blocked)]" />
                    )}
                    <span className={requirement.met ? '' : 'text-muted-foreground'}>{requirement.label}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No tiene prelaciones. Puedes cursarla desde el inicio.</p>
          )}
        </div>

        {subject.unlocks.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-bold">Desbloquea</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {subject.unlocks.map((item) => (
                <span key={item.id} className="rounded-full bg-[#f68629]/10 px-3 py-1.5 text-xs font-semibold text-[#c25a06] dark:text-[#ffa45c]">
                  {item.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-8">
          {subject.status === 'AVAILABLE' && showEnrollLink ? (
            <Link href="/estudiante/pre-inscripcion" className="primary-button w-full">
              Ir a pre-inscripción <ArrowRight />
            </Link>
          ) : (
            <button type="button" className="secondary-button w-full" onClick={onClose}>
              Cerrar
            </button>
          )}
        </div>
      </aside>
    </div>
  )
}
