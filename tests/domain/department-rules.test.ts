import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { assignHeadSchema, departmentNameSchema } from '@/control/validation/department.schema'
import { validateDepartmentHead } from '@/domain/departments/department-rules'
import { DomainError } from '@/domain/shared/domain-error'

describe('validateDepartmentHead', () => {
  const head = { role: 'DEPARTMENT_HEAD', active: true, headedDepartmentId: null }

  it('accepts an active head without a department', () => {
    assert.doesNotThrow(() => validateDepartmentHead(head, 'a'))
  })

  it('accepts the head of the same department', () => {
    assert.doesNotThrow(() => validateDepartmentHead({ ...head, headedDepartmentId: 'a' }, 'a'))
  })

  it('rejects other roles, unknown users, inactive users and heads of another department', () => {
    assert.throws(() => validateDepartmentHead({ ...head, role: 'PROFESSOR' }, 'a'), DomainError)
    assert.throws(() => validateDepartmentHead(null, 'a'), DomainError)
    assert.throws(() => validateDepartmentHead({ ...head, active: false }, 'a'), DomainError)
    assert.throws(() => validateDepartmentHead({ ...head, headedDepartmentId: 'b' }, 'a'), DomainError)
  })
})

describe('department schemas', () => {
  it('requires a name', () => {
    assert.equal(departmentNameSchema.safeParse('   ').success, false)
    assert.equal(departmentNameSchema.parse('  Ingeniería  '), 'Ingeniería')
  })

  it('maps an empty head to null', () => {
    const departmentId = '00000000-0000-4000-8000-000000000000'
    assert.equal(assignHeadSchema.parse({ departmentId, headId: '' }).headId, null)
  })
})
