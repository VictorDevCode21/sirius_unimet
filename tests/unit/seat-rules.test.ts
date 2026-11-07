import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  assertSeatsAvailable,
  evaluateSeats,
  findFullSeats,
  fullSectionMessage,
  pickAlternative,
  type AlternativeSection,
  type SelectedSeat,
} from '@/domain/enrollment/seat-rules'

const fri = (start: number, end: number) => [{ weekday: 'FRI', startMinutes: start, endMinutes: end }]

const seat = (overrides: Partial<SelectedSeat>): SelectedSeat => ({
  sectionId: 's1',
  sectionNumber: 1,
  subjectId: 'redes',
  subjectName: 'Sistemas de Redes',
  capacity: 30,
  taken: 0,
  blocks: [],
  ...overrides,
})

const alternative = (overrides: Partial<AlternativeSection>): AlternativeSection => ({
  sectionId: 'alt',
  number: 2,
  professor: 'Gabriela Torres',
  capacity: 30,
  taken: 0,
  blocks: fri(945, 1125),
  ...overrides,
})

describe('seat rules', () => {
  it('finds the sections whose seats are all taken by confirmed enrollments', () => {
    const seats = [seat({ sectionId: 'a', capacity: 1, taken: 1 }), seat({ sectionId: 'b', capacity: 30, taken: 29 })]
    assert.deepEqual(findFullSeats(seats).map((item) => item.sectionId), ['a'])
  })

  it('prefers an alternative that does not clash with the rest of the selection', () => {
    const clashing = alternative({ sectionId: 'x', number: 2, blocks: fri(480, 600), capacity: 30 })
    const fitting = alternative({ sectionId: 'y', number: 3, blocks: fri(900, 990), capacity: 5 })
    assert.equal(pickAlternative([clashing, fitting], fri(500, 560))?.sectionId, 'y')
  })

  it('ignores alternatives without seats', () => {
    assert.equal(pickAlternative([alternative({ capacity: 2, taken: 2 })], []), null)
  })

  it('suggests another section of the same subject with seats left', () => {
    const full = evaluateSeats([seat({ capacity: 1, taken: 1 })], new Map([['redes', [alternative({ taken: 26 })]]]))
    assert.equal(
      fullSectionMessage(full[0]),
      'La sección 1 de Sistemas de Redes se llenó. Te sugerimos la sección 2 (Gabriela Torres, Vie 15:45–18:45), que tiene 4 cupos.',
    )
  })

  it('says when no other section has seats', () => {
    const full = evaluateSeats([seat({ capacity: 1, taken: 1 })], new Map())
    assert.match(fullSectionMessage(full[0]), /No hay otra sección de esta materia con cupo/)
  })

  it('rejects a confirmation with a full section and accepts one without', () => {
    assert.throws(() => assertSeatsAvailable(evaluateSeats([seat({ capacity: 1, taken: 1 })], new Map())), /se llenó/)
    assert.doesNotThrow(() => assertSeatsAvailable(evaluateSeats([seat({ capacity: 2, taken: 1 })], new Map())))
  })
})
