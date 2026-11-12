import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { previewCurriculumCsv, validateCurriculumCsv } from '@/domain/curriculum/csv-importer'
import { blockedRemovalMessage, compareCurriculum } from '@/domain/curriculum/curriculum-diff'

const header = 'code,name,credits,term,branch,min_credits,prerequisites,alternative'
const csv = (...lines: string[]) => [header, ...lines].join('\n')

describe('curriculum CSV preview', () => {
  it('accepts the seed curriculum without errors', () => {
    const text = readFileSync(path.join(process.cwd(), 'prisma/data/systems-engineering-curriculum.csv'), 'utf8')
    const { rows, issues } = previewCurriculumCsv(text)
    assert.equal(rows.length, 60)
    assert.deepEqual(issues, [])
  })

  it('keeps the line of each error next to its row', () => {
    const { rows, issues } = previewCurriculumCsv(csv('AAA01,Uno,3,1,1,,,', 'AAA02,Dos,0,2,1,,AAA01,', 'aaa03,Tres,3,2,1,,,'))
    assert.deepEqual(rows[0].errors, [])
    assert.deepEqual(rows[1].errors, ['Las UC deben ser un número entero entre 1 y 10.'])
    assert.deepEqual(rows[2].errors, ['El trimestre 2, rama 1 ya tiene la materia AAA02.'])
    assert.deepEqual(
      issues.map((issue) => issue.line),
      [3, 4],
    )
  })

  it('reuses the subject rules of the editor', () => {
    const { rows } = previewCurriculumCsv(csv('1AB,X,3,13,6,,,'))
    assert.equal(rows[0].errors.length, 4)
  })

  it('reuses the prerequisite rules of the editor', () => {
    const { rows } = previewCurriculumCsv(
      csv('AAA01,Uno,3,1,1,,,', 'AAA02,Dos,3,1,2,,AAA01,', 'AAA03,Tres,3,2,1,10,AAA09,', 'AAA04,Cuatro,3,3,1,,AAA04,'),
    )
    assert.deepEqual(rows[1].errors, ['La prelación AAA01 debe ser de un trimestre anterior al de AAA02.'])
    assert.deepEqual(rows[2].errors, ['La prelación AAA09 no existe en el archivo.', 'Las UC mínimas (10) superan las 6 UC de los trimestres anteriores a AAA03.'])
    assert.deepEqual(rows[3].errors, ['AAA04 no puede prelarse a sí misma.'])
  })

  it('reports a malformed alternative', () => {
    const { rows } = previewCurriculumCsv(csv('AAA01,Uno,3,1,1,,,', 'AAA02,Dos,3,2,1,,AAA01,BP57'))
    assert.deepEqual(rows[1].errors, ['La alternativa debe tener el formato UC + bloque, por ejemplo 57BP.'])
  })

  it('reports a wrong header and an empty file once', () => {
    assert.match(previewCurriculumCsv('a,b\n1,2').issues[0].message, /^El encabezado debe ser/)
    assert.deepEqual(previewCurriculumCsv(header).issues, [{ line: null, message: 'El archivo no contiene materias.' }])
  })

  it('formats the errors with their line for the importer', () => {
    assert.deepEqual(validateCurriculumCsv(csv('AAA01,Uno,0,1,1,,,')).errors, ['Línea 2: Las UC deben ser un número entero entre 1 y 10.'])
  })
})

describe('curriculum diff', () => {
  it('splits the file into new, updated and removed subjects', () => {
    const diff = compareCurriculum(['A', 'B', 'C'], [{ code: 'B', sections: 0 }, { code: 'D', sections: 0 }, { code: 'E', sections: 2 }])
    assert.deepEqual(diff, { created: ['A', 'C'], updated: ['B'], removed: ['D', 'E'], blocked: ['E'] })
  })

  it('explains which subjects cannot leave the curriculum', () => {
    assert.equal(blockedRemovalMessage(['E']), 'La materia E tiene secciones y no puede quitarse del pensum.')
    assert.equal(blockedRemovalMessage(['E', 'F']), 'Las materias E, F tienen secciones y no pueden quitarse del pensum.')
  })
})
