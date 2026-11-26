import { z } from 'zod'

export const simulatePaymentSchema = z.object({
  outcome: z.enum(['APPROVED'], { message: 'Resultado de pago inválido.' }),
  attemptId: z.string().uuid('Intento de pago inválido. Recarga la página.'),
})

export type SimulatePaymentInput = z.input<typeof simulatePaymentSchema>
