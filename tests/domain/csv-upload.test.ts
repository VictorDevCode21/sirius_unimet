import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { inspectCurriculumCsv } from '@/domain/curriculum/csv-importer'

const header = 'code,name,credits,term,branch,min_credits,prerequisites,alternative'

describe('curriculum CSV upload', () => {
  it('counts the subject rows of a file with the right header', () => {
    assert.deepEqual(inspectCurriculumCsv(`${header}\nAAA01,Uno,3,1,1,,,\nAAA02,Dos,3,2,1,,AAA01,\n`), { records: 2, error: null })
  })

  it('accepts the header with a byte order mark and different case', () => {
    assert.equal(inspectCurriculumCsv(`﻿${header.toUpperCase()}\nAAA01,Uno,3,1,1,,,`).error, null)
  })

  it('accepts the curriculum shipped with the seed', () => {
    const csv = readFileSync(path.join(process.cwd(), 'prisma/data/systems-engineering-curriculum.csv'), 'utf8')
    assert.deepEqual(inspectCurriculumCsv(csv), { records: 60, error: null })
  })

  it('rejects an empty file, a wrong header and a file without subjects', () => {
    assert.equal(inspectCurriculumCsv('').error, 'El archivo está vacío.')
    assert.match(inspectCurriculumCsv('codigo,nombre\nA,B').error ?? '', /^El encabezado debe ser/)
    assert.equal(inspectCurriculumCsv(`${header}\n`).error, 'El archivo no contiene materias.')
  })
})
