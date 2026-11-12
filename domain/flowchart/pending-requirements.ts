// Pending requirements: what a student still has to meet before taking a subject.
import type { RequirementCheck, SubjectStatus } from '@/domain/prerequisites/prerequisite-engine'

// Unmet requirements of a pending subject. A met alternative satisfies the subject on its own, so nothing is pending;
// an unmet alternative is left out because it is optional.
export function pendingRequirements(subject: { status: SubjectStatus; requirements: RequirementCheck[] }) {
  if (subject.status === 'PASSED' || subject.status === 'IN_PROGRESS') return []
  if (subject.requirements.some((requirement) => requirement.isAlternative && requirement.met)) return []
  return subject.requirements.filter((requirement) => !requirement.isAlternative && !requirement.met).map((requirement) => requirement.label)
}

// Blocked subjects up to the term after the current one, the next steps the student should unlock.
export function nextBlockedSubjects<T extends { term: number; branch: number; status: SubjectStatus }>(subjects: T[], currentTerm: number) {
  return subjects
    .filter((subject) => subject.status === 'BLOCKED' && subject.term <= currentTerm + 1)
    .sort((a, b) => a.term - b.term || a.branch - b.branch)
}
