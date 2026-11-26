import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gradeValueSchema } from '@/control/validation/grade.schema'
import { validatePublishable, validateStudentInSection } from '@/domain/grades/grade-rules'
import { DomainError } from '@/domain/shared/domain-error'

describe('gradeValueSchema', () => {
  it('accepts integers from 0 to 20', () => {
    for (const value of ['0', '10', '20', ' 15 ']) assert.equal(gradeValueSchema.safeParse(value).success, true, value)
  })

  it('rejects values outside the scale, empty and non-integer values', () => {
    for (const value of ['21', '-1', '100', '', '  ', 'abc', '10.5']) assert.equal(gradeValueSchema.safeParse(value).success, false, value)
  })
})

describe('validateStudentInSection', () => {
  it('rejects a student outside the section', () => {
    assert.throws(() => validateStudentInSection(false), DomainError)
    assert.doesNotThrow(() => validateStudentInSection(true))
  })
})

describe('validatePublishable', () => {
  it('requires every enrolled student to have a grade', () => {
    assert.doesNotThrow(() => validatePublishable(3, 3))
    assert.throws(() => validatePublishable(3, 2), /Faltan 1 nota/)
    assert.throws(() => validatePublishable(3, 1), /Faltan 2 notas/)
  })

  it('rejects an empty section', () => {
    assert.throws(() => validatePublishable(0, 0), DomainError)
  })
})
