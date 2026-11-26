import { z } from 'zod'
import { MAX_SECTION_CAPACITY } from '@/domain/sections/section-rules'

const capacity = z.coerce
  .number({ message: 'Indica el cupo de la sección.' })
  .int('El cupo debe ser un número entero.')
  .min(1, 'El cupo debe ser mayor que cero.')
  .max(MAX_SECTION_CAPACITY, `El cupo no puede superar ${MAX_SECTION_CAPACITY} estudiantes.`)

const sectionNumber = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  z.coerce.number().int('El número de sección debe ser entero.').min(1, 'El número de sección debe ser mayor que cero.').max(99, 'El número de sección no puede superar 99.').optional(),
)

export const createSectionSchema = z.object({
  termId: z.string().uuid('Elige un período.'),
  subjectId: z.string().uuid('Elige una materia.'),
  professorId: z.string().uuid('Elige un profesor.'),
  capacity,
  number: sectionNumber,
})

export type CreateSectionInput = z.input<typeof createSectionSchema>

export const sectionIdSchema = z.string().uuid('Sección inválida.')

export const updateSectionSchema = z.object({
  sectionId: sectionIdSchema,
  professorId: z.string().uuid('Elige un profesor.'),
  capacity,
  number: z.coerce
    .number({ message: 'Indica el número de sección.' })
    .int('El número de sección debe ser entero.')
    .min(1, 'El número de sección debe ser mayor que cero.')
    .max(99, 'El número de sección no puede superar 99.'),
})

export type UpdateSectionInput = z.input<typeof updateSectionSchema>

const clockText = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Usa el formato HH:MM.')

const weekday = z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'], { message: 'Elige un día entre lunes y sábado.' })

export const addScheduleBlocksSchema = z.object({
  sectionId: sectionIdSchema,
  weekdays: z
    .array(weekday)
    .min(1, 'Elige al menos un día de clase.')
    .refine((days) => new Set(days).size === days.length, 'Cada día se puede elegir una sola vez.'),
  start: clockText,
  end: clockText,
})

export type AddScheduleBlocksInput = z.input<typeof addScheduleBlocksSchema>

export const removeScheduleBlockSchema = z.object({ sectionId: sectionIdSchema, blockId: z.string().uuid('Bloque inválido.') })
