// CSV importer: validates a curriculum file and creates subjects and prerequisites in a single transaction.
import { createsCycle, type AlternativeRequirement } from '@/domain/prerequisites/prerequisite-engine'

// `alternative` holds credits plus block code (e.g. "57BP") that replace every other requirement of the row.
export const CURRICULUM_CSV_HEADERS = ['code', 'name', 'credits', 'term', 'branch', 'min_credits', 'prerequisites', 'alternative'] as const

export interface CurriculumRow {
  code: string
  name: string
  credits: number
  term: number
  branch: number
  minCredits: number | null
  prerequisiteCodes: string[]
  alternative: AlternativeRequirement | null
}

export interface CurriculumWriter {
  replaceCareerCurriculum(careerId: string, rows: CurriculumRow[]): Promise<void>
}

export type ImportResult = { ok: true; subjects: number; prerequisites: number } | { ok: false; errors: string[] }

// Splits CSV text into rows of fields, honoring double-quoted fields.
export function parseCsv(text: string) {
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let quoted = false

  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"'
        index++
      } else if (char === '"') {
        quoted = false
      } else {
        field += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index++
      row.push(field)
      if (row.some((value) => value.trim())) rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }
  row.push(field)
  if (row.some((value) => value.trim())) rows.push(row)
  return rows
}

// Parses "57BP" or "57 BP" into credits and block; returns undefined when the format is invalid.
function parseAlternative(value: string): AlternativeRequirement | null | undefined {
  const trimmed = value.trim().toUpperCase()
  if (!trimmed) return null
  const match = /^(\d+)\s*([A-Z]+)$/.exec(trimmed)
  return match ? { credits: Number(match[1]), block: match[2] } : undefined
}

function toInteger(value: string) {
  const trimmed = value.trim()
  return /^\d+$/.test(trimmed) ? Number(trimmed) : NaN
}

export function validateCurriculumCsv(text: string): { rows: CurriculumRow[]; errors: string[] } {
  const [header, ...records] = parseCsv(text.replace(/^﻿/, ''))
  const errors: string[] = []

  const normalizedHeader = header?.map((value) => value.trim().toLowerCase()) ?? []
  if (CURRICULUM_CSV_HEADERS.some((column, index) => normalizedHeader[index] !== column)) {
    return { rows: [], errors: [`El encabezado debe ser: ${CURRICULUM_CSV_HEADERS.join(',')}`] }
  }

  const rows: CurriculumRow[] = records.map((record, index) => {
    const line = index + 2
    const [code = '', name = '', credits = '', term = '', branch = '', minCredits = '', prerequisites = '', alternative = ''] = record
    const parsedAlternative = parseAlternative(alternative)
    const row: CurriculumRow = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      credits: toInteger(credits),
      term: toInteger(term),
      branch: toInteger(branch),
      minCredits: minCredits.trim() ? toInteger(minCredits) : null,
      prerequisiteCodes: prerequisites
        .split('|')
        .map((value) => value.trim().toUpperCase())
        .filter(Boolean),
      alternative: parsedAlternative ?? null,
    }
    if (!row.code) errors.push(`Línea ${line}: el código es obligatorio.`)
    if (!row.name) errors.push(`Línea ${line}: el nombre es obligatorio.`)
    if (!(row.credits > 0)) errors.push(`Línea ${line}: las UC deben ser un entero mayor que cero.`)
    if (!(row.term >= 1 && row.term <= 12)) errors.push(`Línea ${line}: el trimestre debe estar entre 1 y 12.`)
    if (!(row.branch >= 1 && row.branch <= 5)) errors.push(`Línea ${line}: la rama debe estar entre 1 y 5.`)
    if (row.minCredits !== null && !(row.minCredits >= 0)) errors.push(`Línea ${line}: las UC mínimas deben ser un entero positivo.`)
    if (parsedAlternative === undefined) {
      errors.push(`Línea ${line}: la alternativa debe tener el formato UC + bloque, por ejemplo 57BP.`)
    } else if (parsedAlternative && !(parsedAlternative.credits > 0)) {
      errors.push(`Línea ${line}: las UC de la alternativa deben ser mayores que cero.`)
    } else if (parsedAlternative && !row.prerequisiteCodes.length && row.minCredits === null) {
      errors.push(`Línea ${line}: la alternativa necesita una prelación o UC mínimas a las que reemplazar.`)
    }
    return row
  })

  const byCode = new Map<string, CurriculumRow>()
  const cells = new Set<string>()
  for (const row of rows) {
    if (byCode.has(row.code)) errors.push(`El código ${row.code} está repetido.`)
    byCode.set(row.code, row)
    const cell = `${row.term}-${row.branch}`
    if (cells.has(cell)) errors.push(`Hay más de una materia en el trimestre ${row.term}, rama ${row.branch}.`)
    cells.add(cell)
  }

  const prerequisitesByCode = new Map<string, string[]>()
  for (const row of rows) {
    for (const requirementCode of row.prerequisiteCodes) {
      const requirement = byCode.get(requirementCode)
      if (requirementCode === row.code) {
        errors.push(`${row.code}: una materia no puede prelarse a sí misma.`)
      } else if (!requirement) {
        errors.push(`${row.code}: la prelación ${requirementCode} no existe en el archivo.`)
      } else if (requirement.term >= row.term) {
        errors.push(`${row.code}: la prelación ${requirementCode} debe ser de un trimestre anterior.`)
      } else if (createsCycle(prerequisitesByCode, row.code, requirementCode)) {
        errors.push(`${row.code}: la prelación ${requirementCode} crea un ciclo.`)
      } else {
        prerequisitesByCode.set(row.code, [...(prerequisitesByCode.get(row.code) ?? []), requirementCode])
      }
    }
  }

  return { rows, errors }
}

export async function importCurriculum(careerId: string, csvText: string, writer: CurriculumWriter): Promise<ImportResult> {
  const { rows, errors } = validateCurriculumCsv(csvText)
  if (!rows.length && !errors.length) errors.push('El archivo no contiene materias.')
  if (errors.length) return { ok: false, errors }

  await writer.replaceCareerCurriculum(careerId, rows)
  return {
    ok: true,
    subjects: rows.length,
    prerequisites: rows.reduce((sum, row) => sum + row.prerequisiteCodes.length, 0),
  }
}
