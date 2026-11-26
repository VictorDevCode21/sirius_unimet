import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  blocksOverlap,
  validateMaxCredits,
  validateScheduleClash,
  type SectionCandidate,
} from '@/domain/enrollment/enrollment-validator'
import { formatSchedule } from '@/domain/shared/schedule-format'

const section = (id: string, subjectName: string, credits: number, blocks: SectionCandidate['blocks'] = []): SectionCandidate => ({
  id,
  subjectId: id,
  subjectName,
  credits,
  blocks,
})

const at = (weekday: string, start: string, end: string) => {
  const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3))
  return { weekday, startMinutes: minutes(start), endMinutes: minutes(end) }
}

describe('credit limit', () => {
  const selected = [section('a', 'Redes', 9), section('b', 'Datos', 9)]

  it('allows reaching the maximum exactly (18 + 2 of 20)', () => {
    assert.doesNotThrow(() => validateMaxCredits(selected, section('c', 'Ética', 2), 20))
  })

  it('rejects going over the maximum (18 + 3 of 20)', () => {
    assert.throws(() => validateMaxCredits(selected, section('c', 'Simulación', 3), 20), /Superas el máximo de 20 créditos del período/)
  })
})

describe('schedule clash', () => {
  it('detects overlapping blocks on the same day only', () => {
    assert.equal(blocksOverlap(at('MON', '07:00', '08:30'), at('MON', '08:00', '09:30')), true)
    assert.equal(blocksOverlap(at('MON', '07:00', '08:30'), at('TUE', '08:00', '09:30')), false)
  })

  it('treats back-to-back blocks as compatible', () => {
    assert.equal(blocksOverlap(at('MON', '07:00', '08:30'), at('MON', '08:30', '10:00')), false)
  })

  it('names the subject, day and time of the clash', () => {
    const selected = [section('fge', 'Electiva de Formación General', 3, [at('FRI', '08:45', '11:45')])]
    const candidate = section('sec', 'Seguridad de la Información', 3, [at('FRI', '10:30', '13:30')])
    assert.throws(
      () => validateScheduleClash(selected, candidate),
      /El horario choca con Electiva de Formación General \(Vie 08:45–11:45\)\. Quita Electiva de Formación General de tu selección/,
    )
  })

  it('formats repeated hours on several days together', () => {
    assert.equal(formatSchedule([at('MON', '14:00', '15:30'), at('WED', '14:00', '15:30')]), 'Lun/Mié 14:00–15:30')
  })
})
