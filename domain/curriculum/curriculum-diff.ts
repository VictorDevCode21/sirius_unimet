// Curriculum diff: what importing a file does to the current curriculum of a career.

export interface CurrentSubject {
  code: string
  sections: number
}

// Subjects with sections cannot leave the curriculum, so a file that drops them is blocked.
export function compareCurriculum(fileCodes: string[], current: CurrentSubject[]) {
  const incoming = new Set(fileCodes)
  const existing = new Set(current.map((subject) => subject.code))
  const removed = current.filter((subject) => !incoming.has(subject.code))
  return {
    created: fileCodes.filter((code) => !existing.has(code)),
    updated: fileCodes.filter((code) => existing.has(code)),
    removed: removed.map((subject) => subject.code),
    blocked: removed.filter((subject) => subject.sections > 0).map((subject) => subject.code),
  }
}

export function blockedRemovalMessage(codes: string[]) {
  return `${codes.length === 1 ? 'La materia' : 'Las materias'} ${codes.join(', ')} ${codes.length === 1 ? 'tiene' : 'tienen'} secciones y no ${codes.length === 1 ? 'puede' : 'pueden'} quitarse del pensum.`
}
