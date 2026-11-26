import { z } from 'zod'

export const enrollSchema = z.object({
  sectionIds: z
    .array(z.string().uuid('Sección inválida. Recarga la página.'))
    .min(1, 'Elige al menos una materia para inscribir.')
    .max(10, 'Elegiste demasiadas materias.'),
})

export type EnrollInput = z.input<typeof enrollSchema>
