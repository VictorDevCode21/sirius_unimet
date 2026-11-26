import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createUserSchema, updateUserSchema, userFilterSchema } from '@/control/validation/user.schema'
import { DomainError } from '@/domain/shared/domain-error'
import { validateRoleChange, validateSelfChange, validateStudentCareer } from '@/domain/users/user-rules'

describe('validateStudentCareer', () => {
  it('requires a career for students', () => {
    assert.throws(() => validateStudentCareer('STUDENT', null), DomainError)
  })

  it('rejects an inactive career', () => {
    assert.throws(() => validateStudentCareer('STUDENT', { active: false }), DomainError)
  })

  it('accepts a student with an active career', () => {
    assert.doesNotThrow(() => validateStudentCareer('STUDENT', { active: true }))
  })

  it('does not require a career for other roles', () => {
    for (const role of ['ADMIN', 'DEPARTMENT_HEAD', 'PROFESSOR'] as const) {
      assert.doesNotThrow(() => validateStudentCareer(role, null))
    }
  })
})

describe('createUserSchema', () => {
  const valid = { name: 'Ana Pérez', email: ' Ana.Perez@Correo.Unimet.edu.ve ', role: 'PROFESSOR', password: 'Segura123', careerId: '' }

  it('normalizes the email and maps an empty career to null', () => {
    const parsed = createUserSchema.parse(valid)
    assert.equal(parsed.email, 'ana.perez@correo.unimet.edu.ve')
    assert.equal(parsed.careerId, null)
  })

  it('rejects invalid input', () => {
    assert.equal(createUserSchema.safeParse({ ...valid, email: 'correo' }).success, false)
    assert.equal(createUserSchema.safeParse({ ...valid, role: 'ROOT' }).success, false)
    assert.equal(createUserSchema.safeParse({ ...valid, password: 'corta' }).success, false)
    assert.equal(createUserSchema.safeParse({ ...valid, name: '' }).success, false)
  })
})

describe('validateRoleChange', () => {
  const change = { current: 'PROFESSOR', next: 'ADMIN', headsDepartment: false, sectionCount: 0, enrollmentCount: 0 } as const

  it('allows a change with no dependent records', () => {
    assert.doesNotThrow(() => validateRoleChange(change))
  })

  it('blocks a change while records depend on the role', () => {
    assert.throws(() => validateRoleChange({ ...change, headsDepartment: true }), DomainError)
    assert.throws(() => validateRoleChange({ ...change, sectionCount: 1 }), DomainError)
    assert.throws(() => validateRoleChange({ ...change, enrollmentCount: 1 }), DomainError)
  })

  it('ignores dependent records when the role stays the same', () => {
    assert.doesNotThrow(() => validateRoleChange({ ...change, next: 'PROFESSOR', sectionCount: 3 }))
  })
})

describe('validateSelfChange', () => {
  it('blocks an admin from removing their own access', () => {
    assert.throws(() => validateSelfChange('a', 'a', { roleChanged: true, deactivating: false }), DomainError)
    assert.throws(() => validateSelfChange('a', 'a', { roleChanged: false, deactivating: true }), DomainError)
  })

  it('allows editing their own data and changing other users', () => {
    assert.doesNotThrow(() => validateSelfChange('a', 'a', { roleChanged: false, deactivating: false }))
    assert.doesNotThrow(() => validateSelfChange('a', 'b', { roleChanged: true, deactivating: true }))
  })
})

describe('updateUserSchema', () => {
  it('requires a valid user id', () => {
    const input = { name: 'Ana Pérez', email: 'ana@test.local', role: 'PROFESSOR', careerId: '' }
    assert.equal(updateUserSchema.safeParse({ ...input, userId: 'x' }).success, false)
    assert.equal(updateUserSchema.safeParse({ ...input, userId: '00000000-0000-4000-8000-000000000000' }).success, true)
  })
})

describe('userFilterSchema', () => {
  it('keeps valid filters', () => {
    assert.deepEqual(userFilterSchema.parse({ search: ' ana ', role: 'STUDENT' }), { search: 'ana', role: 'STUDENT' })
  })

  it('ignores an unknown role from the URL', () => {
    assert.equal(userFilterSchema.parse({ role: 'ROOT' }).role, undefined)
  })
})
