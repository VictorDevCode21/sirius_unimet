import { z } from 'zod'

export const sectionIdSchema = z.string().uuid('Sección inválida.')

export const replaceSectionSchema = z.object({
  replacedSectionId: sectionIdSchema,
  sectionId: sectionIdSchema,
})

export type ReplaceSectionInput = z.input<typeof replaceSectionSchema>
