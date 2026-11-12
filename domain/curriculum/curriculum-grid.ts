// Curriculum grid: a subject sits in one cell, identified by its term (column) and branch (row).
export const CURRICULUM_TERMS = 12
export const CURRICULUM_BRANCHES = 5

export function cellKey(term: number, branch: number) {
  return `${term}-${branch}`
}

export function isCellFree(subjects: { id: string; term: number; branch: number }[], term: number, branch: number, ignoreId?: string) {
  return !subjects.some((subject) => subject.id !== ignoreId && subject.term === term && subject.branch === branch)
}
