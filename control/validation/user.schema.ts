import { z } from 'zod'

const name = z.string({ error: 'Ingresa el nombre.' }).trim().min(2, 'Ingresa el nombre.')
const email = z.string({ error: 'Ingresa un correo válido.' }).trim().toLowerCase().email('Ingresa un correo válido.')
const role = z.enum(['ADMIN', 'DEPARTMENT_HEAD', 'PROFESSOR', 'STUDENT'], { error: 'Selecciona un rol.' })

// An empty selection means no career.
const careerId = z
  .string()
  .trim()
  .transform((value) => value || null)
  .pipe(z.string().uuid('Carrera inválida.').nullable())

export const createUserSchema = z.object({
  name,
  email,
  role,
  password: z.string({ error: 'Ingresa la contraseña inicial.' }).min(8, 'La contraseña inicial debe tener al menos 8 caracteres.'),
  careerId,
})
