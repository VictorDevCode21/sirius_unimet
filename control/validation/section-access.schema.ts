import { z } from 'zod'

export const professorSectionIdSchema = z.string().uuid('Sección inválida.')
