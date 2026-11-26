import { z } from 'zod'

export const careerIdSchema = z.string().uuid('Carrera inválida.')

export const createCareerSchema = z.object({
  name: z.string({ error: 'Ingresa el nombre de la carrera.' }).trim().min(2, 'Ingresa el nombre de la carrera.').max(120, 'El nombre es demasiado largo.'),
  departmentId: z.string({ error: 'Selecciona un departamento.' }).uuid('Selecciona un departamento.'),
})
