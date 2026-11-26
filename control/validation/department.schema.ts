import { z } from 'zod'

export const departmentNameSchema = z
  .string({ error: 'Ingresa el nombre del departamento.' })
  .trim()
  .min(2, 'Ingresa el nombre del departamento.')
  .max(120, 'El nombre es demasiado largo.')

// An empty selection removes the head of the department.
export const assignHeadSchema = z.object({
  departmentId: z.string().uuid('Departamento inválido.'),
  headId: z
    .string()
    .trim()
    .transform((value) => value || null)
    .pipe(z.string().uuid('Usuario inválido.').nullable()),
})
