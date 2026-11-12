import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  countByStatus,
  passingGradesBySubject,
  resolveCurrentCurriculumTerm,
  summarizeFlowchart,
  type SummarizableSubject,
} from '@/domain/flowchart/flowchart-summary'
import { buildAcademicProgress } from '@/domain/grades/academic-progress'
import { resolveSubjectStates, type CurriculumSubject } from '@/domain/prerequisites/prerequisite-engine'

const subject = (id: string, term: number, prerequisiteIds: string[] = [], credits = 3): CurriculumSubject => ({
  id,
  code: id.toUpperCase(),
  name: `Materia ${id}`,
  credits,
  term,
  branch: 1,
  minCredits: null,
  prerequisiteIds,
  alternative: null,
})

describe('flowchart subject status', () => {
  const curriculum = [subject('a', 1), subject('b', 2, ['a']), subject('c', 3, ['b']), subject('d', 1)]

  it('resolves passed, in progress, available and blocked subjects', () => {
    const progress = buildAcademicProgress([{ subjectId: 'a', code: 'A', credits: 3, value: 15, passed: true }], ['d'])
    const statuses = Object.fromEntries(resolveSubjectStates(curriculum, progress).map((state) => [state.id, state.status]))
    assert.deepEqual(statuses, { a: 'PASSED', b: 'AVAILABLE', c: 'BLOCKED', d: 'IN_PROGRESS' })
  })

  it('keeps a failed subject pending', () => {
    const progress = buildAcademicProgress([{ subjectId: 'a', code: 'A', credits: 3, value: 7, passed: false }], [])
    const states = resolveSubjectStates(curriculum, progress)
    assert.equal(states.find((state) => state.id === 'a')?.status, 'AVAILABLE')
    assert.equal(states.find((state) => state.id === 'b')?.status, 'BLOCKED')
  })
})

describe('flowchart summary', () => {
  const subjects: SummarizableSubject[] = [
    { id: 'a', credits: 3, term: 1, status: 'PASSED' },
    { id: 'b', credits: 4, term: 2, status: 'PASSED' },
    { id: 'c', credits: 3, term: 3, status: 'AVAILABLE' },
    { id: 'd', credits: 2, term: 4, status: 'BLOCKED' },
  ]

  it('counts subjects by status, including empty statuses', () => {
    assert.deepEqual(countByStatus(subjects), { PASSED: 2, IN_PROGRESS: 0, AVAILABLE: 1, BLOCKED: 1 })
  })

  it('computes the credit progress over the whole plan', () => {
    const summary = summarizeFlowchart(subjects, 7)
    assert.equal(summary.planCredits, 12)
    assert.equal(summary.passedSubjects, 2)
    assert.equal(summary.totalSubjects, 4)
    assert.ok(Math.abs(summary.progressPercent - 58.333) < 0.01)
  })

  it('returns zero progress for an empty plan', () => {
    assert.equal(summarizeFlowchart([], 0).progressPercent, 0)
  })

  it('places the student in the term of the subjects in progress', () => {
    assert.equal(resolveCurrentCurriculumTerm([...subjects, { id: 'e', credits: 3, term: 5, status: 'IN_PROGRESS' }]), 5)
  })

  it('places the student after the last passed term when nothing is in progress', () => {
    assert.equal(resolveCurrentCurriculumTerm(subjects), 3)
    assert.equal(resolveCurrentCurriculumTerm([]), 1)
  })

  it('never places the student beyond the last curriculum term', () => {
    assert.equal(resolveCurrentCurriculumTerm([{ id: 'z', credits: 3, term: 12, status: 'PASSED' }]), 12)
  })
})

describe('passing grades by subject', () => {
  it('keeps the highest passing grade and ignores failed attempts', () => {
    const grades = passingGradesBySubject([
      { subjectId: 'a', value: 8, passed: false, termName: '2425-1' },
      { subjectId: 'a', value: 12, passed: true, termName: '2425-2' },
      { subjectId: 'b', value: 6, passed: false, termName: '2425-2' },
    ])
    assert.deepEqual(grades.get('a'), { value: 12, termName: '2425-2' })
    assert.equal(grades.has('b'), false)
  })
})
