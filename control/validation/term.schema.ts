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
