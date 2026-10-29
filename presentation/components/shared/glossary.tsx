export const GLOSSARY = {
  uc: { term: 'UC', definition: 'Unidades de crédito: el peso académico de una materia. Tu período tiene un máximo de UC.' },
  prerequisite: {
    term: 'Prelación',
    definition: 'Materia o requisito que debes aprobar antes de poder inscribir otra materia.',
  },
  seat: { term: 'Cupo', definition: 'Puesto disponible en una sección. Cuando se agotan, la sección no acepta más estudiantes.' },
  section: { term: 'Sección', definition: 'Grupo de una materia con su profesor, horario y cupos propios.' },
  period: { term: 'Período', definition: 'Lapso académico en el que cursas materias, por ejemplo 2627-1 o 2627-2.' },
  curriculumTerm: {
    term: 'Trimestre',
    definition: 'Nivel del plan de estudios (I a XII) en el que el flujograma ubica cada materia.',
  },
} as const

export type GlossaryKey = keyof typeof GLOSSARY

// Inline abbreviation that shows the glossary definition as a tooltip.
export function GlossaryTerm({ entry, children }: { entry: GlossaryKey; children: React.ReactNode }) {
  return (
    <abbr title={GLOSSARY[entry].definition} className="cursor-help underline decoration-dotted underline-offset-2">
      {children}
    </abbr>
  )
}
