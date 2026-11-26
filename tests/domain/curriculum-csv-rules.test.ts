import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { countPrerequisites, CURRICULUM_CSV_HEADERS, previewCurriculumCsv, validateCurriculumCsv } from '@/domain/curriculum/csv-importer'

const header = CURRICULUM_CSV_HEADERS.join(',')

describe('curriculum CSV field rules', () => {
  it('accepts the seeded Systems Engineering curriculum', () => {
    const csv = readFileSync(join(process.cwd(), 'prisma/data/systems-engineering-curriculum.csv'), 'utf8')
    const { rows, errors } = validateCurriculumCsv(csv)
    assert.deepEqual(errors, [])
    assert.equal(rows.length, 60)
  })

  it('applies the same code, name and credit rules as the subject form', () => {
    const csv = [header, 'fp-07,Ab,0,1,1,,,', 'FPTSP99,Materia válida,11,2,1,,,'].join('\n')
    const { errors } = validateCurriculumCsv(csv)
    assert.ok(errors.some((error) => error.startsWith('Línea 2: El código FP-07 debe tener letras seguidas de números')))
    assert.ok(errors.includes('Línea 2: El nombre debe tener entre 3 y 100 caracteres.'))
    assert.ok(errors.includes('Línea 2: Las UC deben ser un número entero entre 1 y 10.'))
    assert.ok(errors.includes('Línea 3: Las UC deben ser un número entero entre 1 y 10.'))
  })
})

describe('curriculum CSV preview counts', () => {
  it('counts the prerequisites the import creates', () => {
    const csv = [header, 'AAA01,Materia uno,3,1,1,,,', 'AAA02,Materia dos,3,2,1,,AAA01,', 'AAA03,Materia tres,3,3,1,,AAA01|AAA02,'].join('\n')
    const { rows, issues } = previewCurriculumCsv(csv)
    assert.deepEqual(issues, [])
    assert.equal(countPrerequisites(rows), 3)
  })
})
