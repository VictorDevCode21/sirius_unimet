import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { authorize } from '@/control/auth/authorization'
import { assertOwnsSection, ownsSection } from '@/domain/grades/section-ownership'
import { DomainError } from '@/domain/shared/domain-error'

describe('section ownership', () => {
  it('recognizes the assigned professor', () => {
    assert.equal(ownsSection({ professorId: 'a' }, 'a'), true)
    assert.doesNotThrow(() => assertOwnsSection({ professorId: 'a' }, 'a'))
  })

  it('denies another professor', () => {
    assert.equal(ownsSection({ professorId: 'a' }, 'b'), false)
    assert.throws(() => assertOwnsSection({ professorId: 'a' }, 'b'), DomainError)
  })
})

describe('professor portal authorization', () => {
  it('admits only the professor role', () => {
    assert.equal(authorize('PROFESSOR', '/professor/sections'), true)
    assert.equal(authorize('STUDENT', '/professor/sections'), false)
    assert.equal(authorize('ADMIN', '/professor/sections'), false)
  })
})
