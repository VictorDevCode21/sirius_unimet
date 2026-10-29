'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { BookOpen, CircleHelp, Landmark, X } from 'lucide-react'
import { GLOSSARY } from '@/presentation/components/shared/glossary'

const steps = [
  {
    title: 'Revisa tu flujograma',
    description: 'Identifica las materias disponibles: son las que ya tienen sus prelaciones aprobadas.',
    href: '/student/flowchart',
    linkLabel: 'Ir a mi flujograma',
  },
  {
    title: 'Agrega una sección por materia',
    description: 'En Pre-inscripción elige la sección que mejor se ajuste a tu horario. Te avisamos si choca con otra.',
    href: '/student/pre-enrollment',
    linkLabel: 'Ir a pre-inscripción',
  },
  {
    title: 'Revisa tu selección y monto',
    description: 'En «Tu selección» verifica las UC, el horario y el monto antes de continuar al pago.',
  },
]

// Help button for the portal top bar that opens a side panel with a guide, glossary and contact.
// The panel is portaled to <body> because the top bar's backdrop-filter would otherwise contain the fixed overlay.
export function HelpPanel() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button type="button" className="icon-button" onClick={() => setOpen(true)} aria-label="Ayuda" aria-haspopup="dialog">
        <CircleHelp />
      </button>

      {open &&
        createPortal(
          <div className="modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
            <aside
              className="detail-drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="help-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">Centro de ayuda</p>
                  <h2 id="help-title" className="mt-2 font-display text-3xl font-extrabold uppercase leading-[0.95]">
                    ¿Cómo pre-inscribo?
                  </h2>
                </div>
                <button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Cerrar ayuda">
                  <X />
                </button>
              </div>

              <section className="mt-7" aria-labelledby="help-steps">
                <h3 id="help-steps" className="text-sm font-bold">
                  Guía en 3 pasos
                </h3>
                <ol className="mt-3 flex flex-col gap-2">
                  {steps.map((step, index) => (
                    <li key={step.title} className="flex gap-3 rounded-[1.1rem] bg-muted p-3.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#003087] font-display text-sm font-extrabold text-white dark:bg-[#1859a9]">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold">{step.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.description}</p>
                        {step.href && (
                          <Link
                            href={step.href}
                            onClick={() => setOpen(false)}
                            className="mt-1.5 inline-block text-xs font-bold text-[#003087] dark:text-[#8fb8ff]"
                          >
                            {step.linkLabel} →
                          </Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="mt-8" aria-labelledby="help-glossary">
                <h3 id="help-glossary" className="flex items-center gap-2 text-sm font-bold">
                  <BookOpen className="h-4 w-4" /> Glosario
                </h3>
                <dl className="mt-3 flex flex-col gap-2">
                  {Object.values(GLOSSARY).map((entry) => (
                    <div key={entry.term} className="rounded-[1.1rem] border border-border p-3">
                      <dt className="text-sm font-bold">{entry.term}</dt>
                      <dd className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{entry.definition}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="mt-8 rounded-[1.25rem] bg-[#003087]/6 p-4 dark:bg-white/5" aria-labelledby="help-contact">
                <h3 id="help-contact" className="flex items-center gap-2 text-sm font-bold text-[#003087] dark:text-[#8fb8ff]">
                  <Landmark className="h-4 w-4" /> Contacto
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Para dudas sobre tu inscripción, permisos de acceso o correcciones de tu historial, comunícate con{' '}
                  <strong className="text-foreground">Control de Estudios</strong>.
                </p>
              </section>

              <div className="mt-auto pt-8">
                <button type="button" className="secondary-button w-full" onClick={() => setOpen(false)}>
                  Cerrar
                </button>
              </div>
            </aside>
          </div>,
          document.body,
        )}
    </>
  )
}
