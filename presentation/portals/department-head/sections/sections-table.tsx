import type { ManagedSectionView } from '@/control/controllers/section-management.queries'

// Sections of a term with subject, number, professor and capacity.
export function SectionsTable({ sections, termName, highlightId }: { sections: ManagedSectionView[]; termName: string; highlightId?: string }) {
  if (!sections.length) {
    return (
      <div className="surface card-pad reveal reveal-2 text-center">
        <p className="font-bold">No hay secciones en el período {termName}.</p>
        <p className="mt-1 text-sm text-muted-foreground">Usa «Nueva sección» para crear la primera.</p>
      </div>
    )
  }

  return (
    <div className="surface reveal reveal-2 overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
        <caption className="sr-only">Secciones del período {termName}</caption>
        <thead>
          <tr className="border-b border-border text-[0.68rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            <th scope="col" className="px-5 py-4">Materia</th>
            <th scope="col" className="px-3 py-4">Sección</th>
            <th scope="col" className="px-3 py-4">Profesor</th>
            <th scope="col" className="px-5 py-4 text-right">Cupo</th>
          </tr>
        </thead>
        <tbody>
          {sections.map((section) => (
            <tr key={section.id} className={`border-b border-border last:border-0 hover:bg-muted/60 ${section.id === highlightId ? 'bg-[var(--status-passed-bg)]' : ''}`}>
              <td className="px-5 py-3.5">
                <strong className="block">{section.subject.name}</strong>
                <small className="font-mono text-[0.7rem] text-muted-foreground">
                  {section.subject.code} · {section.subject.career}
                </small>
              </td>
              <td className="px-3 py-3.5 font-semibold">{section.number}</td>
              <td className="px-3 py-3.5">{section.professor.name}</td>
              <td className="px-5 py-3.5 text-right font-display text-lg font-extrabold">{section.capacity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
