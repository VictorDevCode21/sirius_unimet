import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { describeRequirement, nextBlockedSubjects, pendingRequirements } from '@/domain/flowchart/pending-requirements'

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

describe('credit requirements', () => {
  it('says how many credits are missing for the minimum credit rule', () => {
    const minimum = { label: '60 créditos aprobados', met: false, isAlternative: false, credits: { required: 60, passed: 48 } }
    assert.equal(describeRequirement(minimum), 'Faltan 12 UC (mínimo 60)')
    assert.deepEqual(pendingRequirements({ status: 'BLOCKED', requirements: [minimum] }), ['Faltan 12 UC (mínimo 60)'])
  })

  it('says how many block credits are missing for the alternative rule', () => {
    const alternative = { label: '57 créditos aprobados del bloque BP', met: false, isAlternative: true, credits: { required: 57, passed: 40, block: 'BP' } }
    assert.equal(describeRequirement(alternative), 'Faltan 17 UC del bloque BP (mínimo 57)')
  })

  it('keeps the plain label once the credit rule is met', () => {
    const met = { label: '60 créditos aprobados', met: true, isAlternative: false, credits: { required: 60, passed: 75 } }
    assert.equal(describeRequirement(met), '60 créditos aprobados')
  })
})
