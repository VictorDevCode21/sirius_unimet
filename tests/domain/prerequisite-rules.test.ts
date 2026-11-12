import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { validateRequirements, type PrerequisiteNode } from '@/domain/curriculum/prerequisite-rules'

const node = (id: string, term: number, prerequisiteIds: string[] = []): PrerequisiteNode => ({
  id,
  code: id.toUpperCase(),
  term,
  credits: 3,
  prerequisiteIds,
})

const curriculum = [node('bpa1', 1), node('bpa2', 2, ['bpa1']), node('fpb1', 2), node('fpc3', 3, ['bpa2']), node('fpd4', 4)]
const empty = { requirementIds: [], minCredits: null, alternativeCredits: null, alternativeCreditBlock: null }

describe('prerequisite rules', () => {
  it('accepts requirements from earlier terms', () => {
    assert.deepEqual(validateRequirements(curriculum, 'fpc3', { ...empty, requirementIds: ['bpa2', 'fpb1'], minCredits: 6 }), [])
  })

  it('rejects a self reference', () => {
    assert.deepEqual(validateRequirements(curriculum, 'fpc3', { ...empty, requirementIds: ['fpc3'] }), ['FPC3 no puede prelarse a sí misma.'])
  })

  it('rejects a requirement from the same or a later term', () => {
    assert.deepEqual(validateRequirements(curriculum, 'bpa2', { ...empty, requirementIds: ['fpb1'] }), [
      'La prelación FPB1 debe ser de un trimestre anterior al de BPA2.',
    ])
    assert.equal(validateRequirements(curriculum, 'bpa2', { ...empty, requirementIds: ['fpc3'] }).length, 1)
  })

  it('rejects a requirement from another career', () => {
    assert.deepEqual(validateRequirements(curriculum, 'fpc3', { ...empty, requirementIds: ['unknown'] }), [
      'Una de las prelaciones de FPC3 no existe en esta carrera.',
    ])
  })

  it('rejects a requirement that closes a cycle in inconsistent data', () => {
    const inconsistent = [node('x1', 1, ['y2']), node('y2', 2)]
    assert.deepEqual(validateRequirements(inconsistent, 'y2', { ...empty, requirementIds: ['x1'] }), ['La prelación X1 crea un ciclo con Y2.'])
  })

  it('rejects minimum credits that cannot be reached before the subject', () => {
    assert.deepEqual(validateRequirements(curriculum, 'fpc3', { ...empty, minCredits: 10 }), [
      'Las UC mínimas (10) superan las 9 UC de los trimestres anteriores a FPC3.',
    ])
  })

  it('requires both parts of the credit alternative', () => {
    assert.deepEqual(validateRequirements(curriculum, 'fpc3', { ...empty, requirementIds: ['bpa2'], alternativeCredits: 6, alternativeCreditBlock: null }), [
      'La alternativa necesita las UC y el bloque, o ninguno de los dos.',
    ])
  })

  it('accepts a reachable alternative that replaces a prerequisite', () => {
    assert.deepEqual(validateRequirements(curriculum, 'fpc3', { ...empty, requirementIds: ['bpa2'], alternativeCredits: 6, alternativeCreditBlock: 'BP' }), [])
  })

  it('rejects an alternative with more credits than its block offers or with nothing to replace', () => {
    assert.deepEqual(validateRequirements(curriculum, 'fpc3', { ...empty, alternativeCredits: 9, alternativeCreditBlock: 'BP' }), [
      'La alternativa pide 9 UC del bloque BP, pero antes de FPC3 solo hay 6.',
      'La alternativa necesita una prelación o UC mínimas a las que reemplazar.',
    ])
  })
})
