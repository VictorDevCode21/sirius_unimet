// Prerequisite engine: resolves the status of every subject of a curriculum for a student
// and detects prerequisite cycles.

export type SubjectStatus = 'PASSED' | 'IN_PROGRESS' | 'AVAILABLE' | 'BLOCKED'

export interface CurriculumSubject {
  id: string
  code: string
  name: string
  credits: number
  term: number
  branch: number
  minCredits: number | null
  prerequisiteIds: string[]
  alternative: AlternativeRequirement | null
}

// Passed credits from a code block (e.g. 57 credits of "BP" subjects) that replace every other requirement.
export interface AlternativeRequirement {
  credits: number
  block: string
}

export interface AcademicProgress {
  passedSubjectIds: Set<string>
  inProgressSubjectIds: Set<string>
  passedCredits: number
  passedCreditsByCode: Map<string, number>
}

// `isAlternative` marks the check that, when met, satisfies the subject on its own.
export interface RequirementCheck {
  label: string
  met: boolean
  isAlternative: boolean
}

export interface SubjectState extends CurriculumSubject {
  status: SubjectStatus
  requirements: RequirementCheck[]
  unlocks: { id: string; code: string; name: string }[]
}

export function blockCredits(progress: AcademicProgress, block: string) {
  let total = 0
  for (const [code, credits] of progress.passedCreditsByCode) if (code.startsWith(block)) total += credits
  return total
}

export function checkRequirements(
  subject: CurriculumSubject,
  subjectsById: Map<string, CurriculumSubject>,
  progress: AcademicProgress,
): RequirementCheck[] {
  const checks: RequirementCheck[] = subject.prerequisiteIds.map((id) => {
    const requirement = subjectsById.get(id)
    return {
      label: requirement ? `${requirement.name} (${requirement.code})` : 'Materia desconocida',
      met: progress.passedSubjectIds.has(id),
      isAlternative: false,
    }
  })
  if (subject.minCredits) {
    checks.push({
      label: `${subject.minCredits} créditos aprobados`,
      met: progress.passedCredits >= subject.minCredits,
      isAlternative: false,
    })
  }
  if (subject.alternative) {
    checks.push({
      label: `${subject.alternative.credits} créditos aprobados del bloque ${subject.alternative.block}`,
      met: meetsAlternative(subject, progress),
      isAlternative: true,
    })
  }
  return checks
}

export function meetsAlternative(subject: CurriculumSubject, progress: AcademicProgress) {
  return Boolean(subject.alternative && blockCredits(progress, subject.alternative.block) >= subject.alternative.credits)
}

export function meetsPrerequisites(subject: CurriculumSubject, progress: AcademicProgress) {
  const subjectsMet = subject.prerequisiteIds.every((id) => progress.passedSubjectIds.has(id))
  const creditsMet = !subject.minCredits || progress.passedCredits >= subject.minCredits
  return (subjectsMet && creditsMet) || meetsAlternative(subject, progress)
}

export function resolveStatus(subject: CurriculumSubject, progress: AcademicProgress): SubjectStatus {
  if (progress.passedSubjectIds.has(subject.id)) return 'PASSED'
  if (progress.inProgressSubjectIds.has(subject.id)) return 'IN_PROGRESS'
  return meetsPrerequisites(subject, progress) ? 'AVAILABLE' : 'BLOCKED'
}

export function resolveSubjectStates(subjects: CurriculumSubject[], progress: AcademicProgress): SubjectState[] {
  const subjectsById = new Map(subjects.map((subject) => [subject.id, subject]))
  return subjects.map((subject) => ({
    ...subject,
    status: resolveStatus(subject, progress),
    requirements: checkRequirements(subject, subjectsById, progress),
    unlocks: subjects
      .filter((other) => other.prerequisiteIds.includes(subject.id))
      .map((other) => ({ id: other.id, code: other.code, name: other.name })),
  }))
}

// Returns true when adding `requirementId` as a prerequisite of `subjectId` would close a cycle.
export function createsCycle(prerequisitesById: Map<string, string[]>, subjectId: string, requirementId: string) {
  if (subjectId === requirementId) return true
  const pending = [requirementId]
  const visited = new Set<string>()
  while (pending.length) {
    const current = pending.pop()!
    if (current === subjectId) return true
    if (visited.has(current)) continue
    visited.add(current)
    pending.push(...(prerequisitesById.get(current) ?? []))
  }
  return false
}
