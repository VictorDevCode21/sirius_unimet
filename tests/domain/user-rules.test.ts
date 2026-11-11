import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createUserSchema } from '@/control/validation/user.schema'
import { DomainError } from '@/domain/shared/domain-error'
import { validateStudentCareer } from '@/domain/users/user-rules'

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
