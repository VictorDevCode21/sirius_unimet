import { z } from 'zod'

// Converts a YYYY-MM-DD string to UTC midnight; returns null for malformed or impossible dates such as 2027-02-31.
export function parseDateOnly(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date
}

const dateOnly = (requiredMessage: string) =>
  z
    .string({ error: requiredMessage })
    .trim()
    .min(1, requiredMessage)
    .refine((value) => parseDateOnly(value) !== null, 'Ingresa una fecha válida.')
    .transform((value) => parseDateOnly(value)!)

export const createTermSchema = z.object({
  name: z
    .string({ error: 'Ingresa el nombre del periodo.' })
    .trim()
    .regex(/^\d{4}-[1-3]$/, 'El nombre debe tener el formato 2627-1.'),
  startsAt: dateOnly('Ingresa la fecha de inicio.'),
  endsAt: dateOnly('Ingresa la fecha de fin.'),
})

export const termIdSchema = z.string().uuid('Periodo inválido.')

const MAX_RATE_PER_CREDIT = 99_999_999.99
const INVALID_RATE = 'Ingresa un monto numérico mayor que cero, con hasta dos decimales.'

export const ratePerCreditSchema = z.object({
  termId: termIdSchema,
  ratePerCredit: z
    .string({ error: 'Ingresa el monto por UC.' })
    .trim()
    .min(1, 'Ingresa el monto por UC.')
    .regex(/^\d+(\.\d{1,2})?$/, INVALID_RATE)
    .transform(Number)
    .refine((value) => value > 0 && value <= MAX_RATE_PER_CREDIT, INVALID_RATE),
})

const MAX_CREDITS_LIMIT = 99
const INVALID_MAX_CREDITS = `Ingresa un número entero de UC entre 1 y ${MAX_CREDITS_LIMIT}.`

export const maxCreditsSchema = z.object({
  termId: termIdSchema,
  maxCredits: z
    .string({ error: 'Ingresa el máximo de UC.' })
    .trim()
    .min(1, 'Ingresa el máximo de UC.')
    .regex(/^\d+$/, INVALID_MAX_CREDITS)
    .transform(Number)
    .refine((value) => value >= 1 && value <= MAX_CREDITS_LIMIT, INVALID_MAX_CREDITS),
})
