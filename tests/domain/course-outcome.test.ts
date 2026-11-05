import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { PASSING_GRADE, buildAcademicProgress, resolveGradeStatus } from '@/domain/grades/academic-progress'
import { resolveCourseOutcomes } from '@/domain/grades/course-outcome'
import { GRADE_LOCKED_MESSAGE, assertAdminCanCorrect, assertProfessorCanEdit } from '@/domain/grades/grade-rules'
import { resolveSubjectStates, type CurriculumSubject } from '@/domain/prerequisites/prerequisite-engine'

const subject = (id: string, prerequisiteIds: string[] = []): CurriculumSubject => ({
  id,
  code: id.toUpperCase(),
  name: id,
  credits: 3,
  term: prerequisiteIds.length ? 2 : 1,
  branch: 1,
  minCredits: null,
  prerequisiteIds,
  alternative: null,
})

const curriculum = [subject('calculus'), subject('physics', ['calculus'])]

function flowchartAfter(value: number) {
  const progress = buildAcademicProgress(
    [{ subjectId: 'calculus', code: 'CALCULUS', credits: 3, value, passed: resolveGradeStatus(value) === 'PASSED' }],
    [],
  )
  return new Map(resolveSubjectStates(curriculum, progress).map((state) => [state.id, state.status]))
}

describe('grade to course status', () => {
  it('uses 10 as the minimum passing grade', () => {
    assert.equal(PASSING_GRADE, 10)
    assert.equal(resolveGradeStatus(PASSING_GRADE), 'PASSED')
    assert.equal(resolveGradeStatus(PASSING_GRADE - 1), 'FAILED')
  })

  it('marks the subject as passed and unlocks the subjects that require it', () => {
    const states = flowchartAfter(PASSING_GRADE)
    assert.equal(states.get('calculus'), 'PASSED')
    assert.equal(states.get('physics'), 'AVAILABLE')
  })

  it('keeps a failed subject pending and its dependents blocked', () => {
    const states = flowchartAfter(PASSING_GRADE - 1)
    assert.equal(states.get('calculus'), 'AVAILABLE')
    assert.equal(states.get('physics'), 'BLOCKED')
  })
})

describe('resolveCourseOutcomes', () => {
  it('reports failed subjects', () => {
    assert.equal(resolveCourseOutcomes([{ subjectId: 'a', passed: false }]).get('a'), 'FAILED')
  })

  it('keeps a subject passed at any attempt, in either order', () => {
    const attempts = [
      { subjectId: 'a', passed: false },
      { subjectId: 'a', passed: true },
    ]
    assert.equal(resolveCourseOutcomes(attempts).get('a'), 'PASSED')
    assert.equal(resolveCourseOutcomes([...attempts].reverse()).get('a'), 'PASSED')
  })
})

describe('published grade lock', () => {
  it('lets a professor edit a new or unpublished grade', () => {
    assert.doesNotThrow(() => assertProfessorCanEdit(null))
    assert.doesNotThrow(() => assertProfessorCanEdit({ published: false }))
  })

  it('blocks a professor from editing a published grade', () => {
    assert.throws(() => assertProfessorCanEdit({ published: true }), new RegExp(GRADE_LOCKED_MESSAGE))
  })

  it('lets an admin correct only published grades', () => {
    assert.doesNotThrow(() => assertAdminCanCorrect({ published: true }))
    assert.throws(() => assertAdminCanCorrect({ published: false }))
    assert.throws(() => assertAdminCanCorrect(null))
  })
})
