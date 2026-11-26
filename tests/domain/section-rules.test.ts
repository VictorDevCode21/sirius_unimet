import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { authorize } from '@/control/auth/authorization'
import { createSectionSchema } from '@/control/validation/section.schema'
import {
  MAX_SECTION_CAPACITY,
  isTermEditable,
  nextSectionNumber,
  validateProfessor,
  validateSectionCapacity,
  validateSubjectInDepartment,
  validateTermEditable,
} from '@/domain/sections/section-rules'
import { DomainError } from '@/domain/shared/domain-error'

const uuid = '00000000-0000-4000-8000-000000000000'

describe('HU-10A section rules', () => {
  it('accepts capacities between 1 and the maximum', () => {
    assert.doesNotThrow(() => validateSectionCapacity(1))
    assert.doesNotThrow(() => validateSectionCapacity(MAX_SECTION_CAPACITY))
  })

  it('rejects zero, negative, fractional and oversized capacities', () => {
    for (const value of [0, -5, 2.5, MAX_SECTION_CAPACITY + 1]) {
      assert.throws(() => validateSectionCapacity(value), DomainError)
    }
  })

  it('treats a term as editable until its last day', () => {
    const term = { name: '2627-1', endsAt: new Date(Date.UTC(2026, 11, 15)) }
    assert.equal(isTermEditable(term, new Date(Date.UTC(2026, 11, 15, 22))), true)
    assert.equal(isTermEditable(term, new Date(Date.UTC(2026, 11, 16, 1))), false)
    assert.throws(() => validateTermEditable(term, new Date(Date.UTC(2027, 0, 1))), /ya finalizó/)
    assert.throws(() => validateTermEditable(null, new Date()), /no existe/)
  })

  it('requires an active professor and a department subject', () => {
    assert.doesNotThrow(() => validateProfessor({ role: 'PROFESSOR', active: true }))
    assert.throws(() => validateProfessor({ role: 'STUDENT', active: true }), /no existe/)
    assert.throws(() => validateProfessor({ role: 'PROFESSOR', active: false }), /inactivo/)
    assert.throws(() => validateProfessor(null), DomainError)
    assert.throws(() => validateSubjectInDepartment(null), /departamento/)
  })

  it('assigns the next free section number', () => {
    assert.equal(nextSectionNumber([]), 1)
    assert.equal(nextSectionNumber([1, 3, 2]), 4)
  })

  it('validates the create section input', () => {
    const valid = createSectionSchema.safeParse({ termId: uuid, subjectId: uuid, professorId: uuid, capacity: '25', number: '' })
    assert.equal(valid.success, true)
    assert.equal(valid.success && valid.data.capacity, 25)
    assert.equal(valid.success && valid.data.number, undefined)

    for (const capacity of ['0', 'abc', '3.5', String(MAX_SECTION_CAPACITY + 1)]) {
      assert.equal(createSectionSchema.safeParse({ termId: uuid, subjectId: uuid, professorId: uuid, capacity }).success, false, capacity)
    }
    assert.equal(createSectionSchema.safeParse({ termId: 'x', subjectId: uuid, professorId: uuid, capacity: 10 }).success, false)
  })

  it('only lets department heads into the department head portal', () => {
    assert.equal(authorize('DEPARTMENT_HEAD', '/department-head/sections'), true)
    assert.equal(authorize('STUDENT', '/department-head/sections'), false)
    assert.equal(authorize('PROFESSOR', '/department-head/sections/new'), false)
  })
})
