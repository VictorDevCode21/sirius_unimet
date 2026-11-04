import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  joinList,
  missingPrerequisitesMessage,
  validatePrerequisites,
  validateReplacement,
  validateSingleSectionPerSubject,
  type SectionCandidate,
} from '@/domain/enrollment/enrollment-validator'
import type { SubjectState } from '@/domain/prerequisites/prerequisite-engine'
import { DomainError } from '@/domain/shared/domain-error'

const section = (id: string, subjectId: string, number = 1): SectionCandidate => ({
  id,
  number,
  subjectId,
  subjectName: subjectId === 'redes' ? 'Sistemas de Redes' : 'Simulación',
  credits: 3,
  blocks: [],
})

const blockedSubject = (requirements: SubjectState['requirements']) =>
  ({ id: 's', code: 'FPTSP18', name: 'Seguridad de la Información', status: 'BLOCKED', requirements }) as SubjectState

describe('prerequisite message', () => {
  it('joins items as a Spanish list', () => {
    assert.equal(joinList(['A']), 'A')
    assert.equal(joinList(['A', 'B']), 'A y B')
    assert.equal(joinList(['A', 'B', 'C']), 'A, B y C')
  })

  it('names every missing subject', () => {
    const message = missingPrerequisitesMessage(
      blockedSubject([
        { label: 'Física II (BPTFI02)', met: false, isAlternative: false },
        { label: 'Matemáticas II (BPTMI02)', met: false, isAlternative: false },
        { label: 'Física I (BPTFI01)', met: true, isAlternative: false },
      ]),
    )
    assert.equal(message, 'No puedes inscribir Seguridad de la Información. Te falta: Física II (BPTFI02) y Matemáticas II (BPTMI02).')
  })

  it('names missing credits and the credit alternative', () => {
    const message = missingPrerequisitesMessage(
      blockedSubject([
        { label: '150 créditos aprobados', met: false, isAlternative: false },
        { label: '57 créditos aprobados del bloque BP', met: false, isAlternative: true },
      ]),
    )
    assert.match(message, /Te falta: 150 créditos aprobados \(o 57 créditos aprobados del bloque BP\)\.$/)
  })

  it('rejects a blocked subject with the detailed message', () => {
    const subject = blockedSubject([{ label: 'Física II (BPTFI02)', met: false, isAlternative: false }])
    assert.throws(() => validatePrerequisites(subject), (error: unknown) => {
      assert.ok(error instanceof DomainError)
      assert.match(error.message, /Física II \(BPTFI02\)/)
      return true
    })
  })
})

describe('one section per subject and replacement', () => {
  it('asks to replace when the subject already has a section', () => {
    assert.throws(
      () => validateSingleSectionPerSubject([section('a', 'redes', 1)], section('b', 'redes', 2)),
      /Ya tienes la sección 1 de Sistemas de Redes en tu pre-inscripción\. Usa «Reemplazar»/,
    )
  })

  it('returns the selection without the replaced section', () => {
    const selected = [section('a', 'redes', 1), section('c', 'simulacion')]
    const remaining = validateReplacement(selected, 'a', section('b', 'redes', 2))
    assert.deepEqual(remaining.map((item) => item.id), ['c'])
  })

  it('rejects replacing a section that is not selected, of another subject or with itself', () => {
    const selected = [section('a', 'redes', 1), section('c', 'simulacion')]
    assert.throws(() => validateReplacement(selected, 'x', section('b', 'redes', 2)), /ya no está en tu pre-inscripción/)
    assert.throws(() => validateReplacement(selected, 'c', section('b', 'redes', 2)), /misma materia/)
    assert.throws(() => validateReplacement(selected, 'a', section('a', 'redes', 1)), /ya está en tu pre-inscripción/)
  })
})
