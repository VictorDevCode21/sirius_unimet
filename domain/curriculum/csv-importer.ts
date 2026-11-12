// CSV importer: validates a curriculum file and creates subjects and prerequisites in a single transaction.
import { validateRequirements, type PrerequisiteNode } from '@/domain/curriculum/prerequisite-rules'
import { validateSubjectFields, validateSubjectPlacement, type PlacedSubject } from '@/domain/curriculum/subject-rules'
import type { AlternativeRequirement } from '@/domain/prerequisites/prerequisite-engine'

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

export const CURRICULUM_CSV_MAX_BYTES = 1024 * 1024

// First check of an uploaded file: right header and at least one subject row.
export function inspectCurriculumCsv(text: string): { records: number; error: string | null } {
  const [header, ...records] = parseCsv(text.replace(/^\uFEFF/, ''))
  const normalizedHeader = header?.map((value) => value.trim().toLowerCase()) ?? []
  if (!header) return { records: 0, error: 'El archivo está vacío.' }
  if (CURRICULUM_CSV_HEADERS.some((column, index) => normalizedHeader[index] !== column)) {
    return { records: records.length, error: `El encabezado debe ser: ${CURRICULUM_CSV_HEADERS.join(',')}` }
  }
  if (!records.length) return { records: 0, error: 'El archivo no contiene materias.' }
  return { records: records.length, error: null }
}

export interface CsvIssue {
  line: number | null
  message: string
}

export interface CsvPreviewRow extends CurriculumRow {
  line: number
  errors: string[]
}

const formatIssue = (issue: CsvIssue) => (issue.line ? `Línea ${issue.line}: ${issue.message}` : issue.message)

// Validates every row with the same subject and prerequisite rules as the curriculum editor, keeping the line of each
// problem so the preview can show it next to the row.
export function previewCurriculumCsv(text: string): { rows: CsvPreviewRow[]; issues: CsvIssue[] } {
  const [header, ...records] = parseCsv(text.replace(/^\uFEFF/, ''))
  const normalizedHeader = header?.map((value) => value.trim().toLowerCase()) ?? []
  if (CURRICULUM_CSV_HEADERS.some((column, index) => normalizedHeader[index] !== column)) {
    return { rows: [], issues: [{ line: null, message: `El encabezado debe ser: ${CURRICULUM_CSV_HEADERS.join(',')}` }] }
  }

  const rows: CsvPreviewRow[] = records.map((record, index) => {
    const [code = '', name = '', credits = '', term = '', branch = '', minCredits = '', prerequisites = '', alternative = ''] = record
    const parsedAlternative = parseAlternative(alternative)
    const row: CsvPreviewRow = {
      line: index + 2,
      errors: [],
      code: code.trim().toUpperCase(),
      name: name.trim(),
      credits: toInteger(credits),
      term: toInteger(term),
      branch: toInteger(branch),
      minCredits: minCredits.trim() ? toInteger(minCredits) : null,
      prerequisiteCodes: [
        ...new Set(
          prerequisites
            .split('|')
            .map((value) => value.trim().toUpperCase())
            .filter(Boolean),
        ),
      ],
      alternative: parsedAlternative ?? null,
    }
    row.errors.push(...validateSubjectFields(row))
    if (row.minCredits !== null && Number.isNaN(row.minCredits)) row.errors.push('Las UC mínimas deben ser un número entero positivo.')
    if (parsedAlternative === undefined) row.errors.push('La alternativa debe tener el formato UC + bloque, por ejemplo 57BP.')
    return row
  })

  const placed: PlacedSubject[] = []
  for (const row of rows) {
    row.errors.push(...validateSubjectPlacement(placed, row))
    placed.push({ id: String(row.line), code: row.code, name: row.name, term: row.term, branch: row.branch })
  }

  const codes = new Set(rows.map((row) => row.code))
  const nodes: PrerequisiteNode[] = rows.map((row) => ({
    id: row.code,
    code: row.code,
    term: row.term,
    credits: Number.isInteger(row.credits) ? row.credits : 0,
    prerequisiteIds: row.prerequisiteCodes.filter((code) => codes.has(code) && code !== row.code),
  }))
  for (const row of rows) {
    if (!row.code || !Number.isInteger(row.term)) continue
    for (const code of row.prerequisiteCodes) {
      if (!codes.has(code)) row.errors.push(`La prelación ${code} no existe en el archivo.`)
    }
    row.errors.push(
      ...validateRequirements(nodes, row.code, {
        requirementIds: row.prerequisiteCodes.filter((code) => codes.has(code)),
        minCredits: row.minCredits !== null && Number.isNaN(row.minCredits) ? null : row.minCredits,
        alternativeCredits: row.alternative?.credits ?? null,
        alternativeCreditBlock: row.alternative?.block ?? null,
      }),
    )
  }

  const issues: CsvIssue[] = rows.flatMap((row) => [...new Set(row.errors)].map((message) => ({ line: row.line, message })))
  for (const row of rows) row.errors = [...new Set(row.errors)]
  if (!rows.length) issues.push({ line: null, message: 'El archivo no contiene materias.' })
  return { rows, issues }
}

export function validateCurriculumCsv(text: string): { rows: CurriculumRow[]; errors: string[] } {
  const { rows, issues } = previewCurriculumCsv(text)
  return { rows: rows.map(({ line: _line, errors: _errors, ...row }) => row), errors: issues.map(formatIssue) }
}

export async function importCurriculum(careerId: string, csvText: string, writer: CurriculumWriter): Promise<ImportResult> {
  const { rows, errors } = validateCurriculumCsv(csvText)
  if (errors.length) return { ok: false, errors }

  await writer.replaceCareerCurriculum(careerId, rows)
  return {
    ok: true,
    subjects: rows.length,
    prerequisites: rows.reduce((sum, row) => sum + row.prerequisiteCodes.length, 0),
  }
}
