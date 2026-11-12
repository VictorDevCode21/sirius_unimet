import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { nextBlockedSubjects, pendingRequirements } from '@/domain/flowchart/pending-requirements'

const check = (label: string, met: boolean, isAlternative = false) => ({ label, met, isAlternative })

describe('pending requirements', () => {
  it('lists the unmet requirements of a blocked subject', () => {
    const pending = pendingRequirements({
      status: 'BLOCKED',
      requirements: [check('Matemáticas I (BPTMI01)', true), check('Física I (BPTFI01)', false), check('60 créditos aprobados', false)],
    })
    assert.deepEqual(pending, ['Física I (BPTFI01)', '60 créditos aprobados'])
  })

  it('leaves out an unmet alternative because it is optional', () => {
    const pending = pendingRequirements({
      status: 'BLOCKED',
      requirements: [check('Física II (BPTFI02)', false), check('57 créditos aprobados del bloque BP', false, true)],
    })
    assert.deepEqual(pending, ['Física II (BPTFI02)'])
  })

  it('has nothing pending when the alternative is met', () => {
    const pending = pendingRequirements({
      status: 'AVAILABLE',
      requirements: [check('Física II (BPTFI02)', false), check('57 créditos aprobados del bloque BP', true, true)],
    })
    assert.deepEqual(pending, [])
  })

  it('has nothing pending for passed or in-progress subjects', () => {
    assert.deepEqual(pendingRequirements({ status: 'PASSED', requirements: [check('X', false)] }), [])
    assert.deepEqual(pendingRequirements({ status: 'IN_PROGRESS', requirements: [check('X', false)] }), [])
  })
})

describe('next blocked subjects', () => {
  it('returns blocked subjects up to the next term, ordered by term and branch', () => {
    const subjects = [
      { id: 'a', term: 4, branch: 2, status: 'BLOCKED' as const },
      { id: 'b', term: 3, branch: 3, status: 'BLOCKED' as const },
      { id: 'c', term: 3, branch: 1, status: 'BLOCKED' as const },
      { id: 'd', term: 5, branch: 1, status: 'BLOCKED' as const },
      { id: 'e', term: 3, branch: 2, status: 'AVAILABLE' as const },
    ]
    assert.deepEqual(nextBlockedSubjects(subjects, 3).map((subject) => subject.id), ['c', 'b', 'a'])
  })
})
