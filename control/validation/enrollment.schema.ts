import { z } from 'zod'

export const sectionIdSchema = z.string().uuid('Sección inválida.')
