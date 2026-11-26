import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { assertValidSubject, validateSubjectFields, validateSubjectPlacement } from '@/domain/curriculum/subject-rules'
import { DomainError } from '@/domain/shared/domain-error'

const valid = { code: 'FPTSP07', name: 'Ingeniería de Software', credits: 3, term: 8, branch: 5 }
const existing = [{ id: 's1', code: 'FPTSP07', name: 'Ingeniería de Software', term: 8, branch: 5 }]

describe('subject fields', () => {
  it('accepts a valid subject', () => {
    assert.deepEqual(validateSubjectFields(valid), [])
    assert.deepEqual(validateSubjectFields({ ...valid, code: 'FPS1' }), [])
  })

  it('requires code and name', () => {
    assert.deepEqual(validateSubjectFields({ ...valid, code: '', name: '' }), ['El código es obligatorio.', 'El nombre es obligatorio.'])
  })

  it('rejects a code that is not letters followed by numbers', () => {
    assert.equal(validateSubjectFields({ ...valid, code: '07FPTSP' }).length, 1)
    assert.equal(validateSubjectFields({ ...valid, code: 'FPT-SP07' }).length, 1)
  })

  it('rejects names that are too short or too long', () => {
    assert.equal(validateSubjectFields({ ...valid, name: 'IS' }).length, 1)
    assert.equal(validateSubjectFields({ ...valid, name: 'x'.repeat(101) }).length, 1)
  })

  it('rejects credits outside 1 to 10 or not integer', () => {
    for (const credits of [0, -3, 11, 2.5, NaN]) assert.equal(validateSubjectFields({ ...valid, credits }).length, 1, `credits ${credits}`)
  })

  it('rejects a cell outside the grid', () => {
    assert.equal(validateSubjectFields({ ...valid, term: 13 }).length, 1)
    assert.equal(validateSubjectFields({ ...valid, branch: 0 }).length, 1)
  })
})

describe('subject placement', () => {
  it('rejects a repeated code and an occupied cell', () => {
    assert.deepEqual(validateSubjectPlacement(existing, valid), [
      'El código FPTSP07 ya pertenece a Ingeniería de Software.',
      'El trimestre 8, rama 5 ya tiene la materia FPTSP07.',
    ])
  })

  it('ignores the subject being edited', () => {
    assert.deepEqual(validateSubjectPlacement(existing, valid, 's1'), [])
  })

  it('throws a DomainError with every problem', () => {
    assert.throws(() => assertValidSubject(existing, { ...valid, credits: 0 }), (error) => error instanceof DomainError && error.message.includes('UC'))
  })
})
