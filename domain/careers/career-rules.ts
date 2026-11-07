// Career rules: unique names and when a career can be deleted.

export const CAREER_TAKEN_MESSAGE = 'Ya existe una carrera con ese nombre.'
export const CAREER_IN_USE_MESSAGE = 'Esta carrera tiene estudiantes o materias, por lo que no se puede eliminar. Puedes desactivarla.'

// A career with students or subjects stays in the system; it can only be deactivated.
export function canDeleteCareer(usage: { studentCount: number; subjectCount: number }) {
  return usage.studentCount === 0 && usage.subjectCount === 0
}
