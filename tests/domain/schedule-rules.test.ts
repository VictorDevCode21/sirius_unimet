import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { addScheduleBlocksSchema } from '@/control/validation/section.schema'
import {
  buildWeeklyBlocks,
  parseClock,
  validateBlockRange,
  validateNoOverlapInSection,
  validateProfessorAvailability,
  validateScheduleChangeAllowed,
} from '@/domain/sections/schedule-rules'

const block = (weekday: string, start: string, end: string) => ({ weekday, startMinutes: parseClock(start)!, endMinutes: parseClock(end)! })

describe('HU-11 schedule rules', () => {
  it('parses HH:MM clocks', () => {
    assert.equal(parseClock('07:00'), 420)
    assert.equal(parseClock('21:45'), 1305)
    assert.equal(parseClock('7:00'), null)
    assert.equal(parseClock('24:00'), null)
  })

  it('accepts a valid block', () => {
    assert.doesNotThrow(() => validateBlockRange(block('MON', '07:00', '08:30')))
    assert.doesNotThrow(() => validateBlockRange(block('SAT', '20:30', '22:00')))
  })

  it('rejects inverted, out of range, too short, off-step blocks and Sundays', () => {
    assert.throws(() => validateBlockRange(block('MON', '10:00', '09:00')), /posterior/)
    assert.throws(() => validateBlockRange(block('MON', '06:30', '08:00')), /entre las 07:00 y las 22:00/)
    assert.throws(() => validateBlockRange(block('MON', '21:00', '22:30')), /entre/)
    assert.throws(() => validateBlockRange(block('MON', '08:00', '08:15')), /al menos 30/)
    assert.throws(() => validateBlockRange(block('MON', '08:02', '09:00')), /múltiplos/)
    assert.throws(() => validateBlockRange(block('SUN', '08:00', '09:00')), /lunes y sábado/)
  })

  it('rejects overlaps inside the same section but allows touching blocks', () => {
    const existing = [block('TUE', '08:45', '10:15')]
    assert.throws(() => validateNoOverlapInSection(existing, block('TUE', '10:00', '11:00')), /solapa/)
    assert.doesNotThrow(() => validateNoOverlapInSection(existing, block('TUE', '10:15', '11:45')))
    assert.doesNotThrow(() => validateNoOverlapInSection(existing, block('WED', '08:45', '10:15')))
  })

  it('rejects a professor teaching two sections at the same time', () => {
    const busy = [{ ...block('THU', '14:00', '15:30'), subjectName: 'Cálculo I', sectionNumber: 2 }]
    assert.throws(() => validateProfessorAvailability('Ana Martínez', busy, [block('THU', '15:00', '16:00')]), /Ana Martínez ya dicta Cálculo I \(sección 2\)/)
    assert.doesNotThrow(() => validateProfessorAvailability('Ana Martínez', busy, [block('THU', '15:30', '17:00')]))
  })

  it('blocks schedule changes on sections with enrolled students', () => {
    assert.throws(() => validateScheduleChangeAllowed(2), /2 estudiantes inscritos/)
    assert.doesNotThrow(() => validateScheduleChangeAllowed(0))
  })

  it('validates the add block input', () => {
    const sectionId = '00000000-0000-4000-8000-000000000000'
    assert.equal(addScheduleBlocksSchema.safeParse({ sectionId, weekdays: ['FRI'], start: '07:00', end: '10:00' }).success, true)
    assert.equal(addScheduleBlocksSchema.safeParse({ sectionId, weekdays: ['MON', 'WED'], start: '14:00', end: '15:30' }).success, true)
    assert.equal(addScheduleBlocksSchema.safeParse({ sectionId, weekdays: ['SUN'], start: '07:00', end: '10:00' }).success, false)
    assert.equal(addScheduleBlocksSchema.safeParse({ sectionId, weekdays: ['FRI'], start: '7am', end: '10:00' }).success, false)
    assert.equal(addScheduleBlocksSchema.safeParse({ sectionId, weekdays: [], start: '07:00', end: '10:00' }).success, false)
    assert.equal(addScheduleBlocksSchema.safeParse({ sectionId, weekdays: ['MON', 'MON'], start: '07:00', end: '10:00' }).success, false)
  })

  it('builds one block per chosen day with the same time range', () => {
    const blocks = buildWeeklyBlocks(['MON', 'WED'], parseClock('14:00')!, parseClock('15:30')!)
    assert.deepEqual(blocks, [
      { weekday: 'MON', startMinutes: 840, endMinutes: 930 },
      { weekday: 'WED', startMinutes: 840, endMinutes: 930 },
    ])
  })

  it('rejects an empty or repeated day list and invalid ranges on any day', () => {
    assert.throws(() => buildWeeklyBlocks([], 420, 510), /al menos un día/)
    assert.throws(() => buildWeeklyBlocks(['MON', 'MON'], 420, 510), /una sola vez/)
    assert.throws(() => buildWeeklyBlocks(['MON', 'TUE'], 600, 540), /posterior/)
    assert.throws(() => buildWeeklyBlocks(['MON', 'SUN'], 420, 510), /lunes y sábado/)
  })
})
