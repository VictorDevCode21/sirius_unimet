import { z } from 'zod'

const methods = ['PAGO_MOVIL', 'BANK_TRANSFER_VES', 'IMMEDIATE_DEBIT', 'ONLINE_CARD', 'ZELLE', 'BINANCE_PAY', 'US_BANK_TRANSFER'] as const

const fields = z.record(z.string(), z.string().max(120, 'Uno de los datos es demasiado largo.'))

export const registerPaymentSchema = z.object({
  termId: z.string().uuid('Período inválido. Recarga la página.'),
  method: z.enum(methods, { message: 'Elige un método de pago.' }),
  amount: z
    .string()
    .trim()
    .regex(/^\d+([.,]\d{1,2})?$/, 'Escribe el monto con hasta 2 decimales, por ejemplo 135,00.'),
  fields,
  otpToken: z.string().max(200).optional(),
})

export type RegisterPaymentInput = z.input<typeof registerPaymentSchema>

export const debitOtpSchema = z.object({ termId: z.string().uuid('Período inválido. Recarga la página.'), fields })

export type DebitOtpInput = z.input<typeof debitOtpSchema>
