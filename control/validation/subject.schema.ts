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
