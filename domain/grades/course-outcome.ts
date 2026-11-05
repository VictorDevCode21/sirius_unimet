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
