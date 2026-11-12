import { z } from 'zod'

const integer = (message: string) => z.coerce.number({ error: message }).int(message)

export const subjectSchema = z.object({
  careerId: z.uuid('Selecciona una carrera.'),
  code: z.string({ error: 'Ingresa el código de la materia.' }).trim().toUpperCase().min(1, 'Ingresa el código de la materia.'),
  name: z.string({ error: 'Ingresa el nombre de la materia.' }).trim().min(1, 'Ingresa el nombre de la materia.'),
  credits: integer('Las UC deben ser un número entero.'),
  term: integer('El trimestre debe ser un número entero.'),
  branch: integer('La rama debe ser un número entero.'),
})

export type SubjectInput = z.input<typeof subjectSchema>

export const subjectUpdateSchema = subjectSchema.omit({ careerId: true }).extend({ subjectId: z.uuid('Selecciona una materia.') })

export type SubjectUpdateInput = z.input<typeof subjectUpdateSchema>

const optionalCount = (message: string) =>
  z.preprocess((value) => (value === '' || value === null || value === undefined ? null : value), z.coerce.number({ error: message }).int(message).min(0, message).nullable())

export const requirementsSchema = z.object({
  subjectId: z.uuid('Selecciona una materia.'),
  requirementIds: z.array(z.uuid('Prelación inválida.')).transform((ids) => [...new Set(ids)]),
  minCredits: optionalCount('Las UC mínimas deben ser un número entero positivo.'),
  alternativeCredits: optionalCount('Las UC de la alternativa deben ser un número entero positivo.'),
  alternativeCreditBlock: z
    .string()
    .trim()
    .toUpperCase()
    .transform((value) => value || null)
    .nullable()
    .optional()
    .transform((value) => value ?? null),
})

export type RequirementsInput = z.input<typeof requirementsSchema>
