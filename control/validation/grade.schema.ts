import { z } from 'zod'

const INVALID_GRADE = 'Ingresa una nota entera entre 0 y 20.'

export const gradeValueSchema = z
  .string({ error: INVALID_GRADE })
  .trim()
  .regex(/^\d{1,2}$/, INVALID_GRADE)
  .transform(Number)
  .refine((value) => value <= 20, INVALID_GRADE)

export const saveGradeSchema = z.object({
  sectionId: z.string().uuid('Sección inválida.'),
  studentId: z.string().uuid('Estudiante inválido.'),
  value: gradeValueSchema,
})
