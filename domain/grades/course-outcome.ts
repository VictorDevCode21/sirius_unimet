// Course outcome: result of each graded subject of a student, for the flowchart to show as Aprobada or Reprobada.
// A failed subject stays pending: the prerequisite engine keeps it out of the passed subjects, so it can be retaken.

export type CourseOutcome = 'PASSED' | 'FAILED'

// A subject passed at any attempt stays passed, regardless of the attempts that failed.
export function resolveCourseOutcomes(grades: { subjectId: string; passed: boolean }[]) {
  const outcomes = new Map<string, CourseOutcome>()
  for (const { subjectId, passed } of grades) {
    if (passed) outcomes.set(subjectId, 'PASSED')
    else if (!outcomes.has(subjectId)) outcomes.set(subjectId, 'FAILED')
  }
  return outcomes
}

// Flags the subjects whose published attempts are all failed. The status is left as the prerequisite engine resolved
// it, so a failed subject keeps counting as pending (available or blocked) and can be retaken.
export function markFailedSubjects<T extends { id: string; status: string }>(
  subjects: T[],
  grades: { subjectId: string; passed: boolean }[],
): (T & { failed: boolean })[] {
  const outcomes = resolveCourseOutcomes(grades)
  return subjects.map((subject) => ({ ...subject, failed: subject.status !== 'PASSED' && outcomes.get(subject.id) === 'FAILED' }))
}
