'use server'

import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { getStudentContext } from '@/control/controllers/student-context'
import { debitOtpSchema, registerPaymentSchema, type DebitOtpInput, type RegisterPaymentInput } from '@/control/validation/payment.schema'
import { getBcvUsdRate } from '@/data-access/external/bcv-rate'
import { findEnrollment } from '@/data-access/repositories/enrollment.repository'
import { recordPayment } from '@/data-access/repositories/payment.repository'
import { summarizeBalance, validatePaymentAmount } from '@/domain/billing/account-balance'
import { checkPaymentDetails, findPaymentMethod, toBolivares } from '@/domain/billing/payment-methods'
import { DomainError } from '@/domain/shared/domain-error'

export interface PaymentActionResult {
  ok: boolean
  message: string
  reference?: string
}

export interface DebitOtpResult {
  ok: boolean
  message: string
  // Simulated SMS: the code is returned so the page can show it, as the bank would send it to the phone.
  smsCode?: string
  otpToken?: string
}

const OTP_TTL_MS = 5 * 60 * 1000

const otpSignature = (payload: string) => createHmac('sha256', process.env.AUTH_SECRET ?? 'sirius-dev-secret').update(payload).digest('hex')

function otpPayload(studentId: string, fields: Record<string, string>, code: string, expiresAt: number) {
  return [studentId, fields.bank ?? '', (fields.phone ?? '').replace(/\D/g, ''), (fields.idNumber ?? '').toUpperCase(), code, expiresAt].join('|')
}

function verifyOtp(studentId: string, fields: Record<string, string>, token: string | undefined) {
  const [expires, signature] = (token ?? '').split('.')
  const expiresAt = Number(expires)
  if (!signature || !Number.isFinite(expiresAt)) throw new DomainError('Solicita la clave de débito antes de pagar.')
  if (Date.now() > expiresAt) throw new DomainError('La clave de débito venció. Solicita una nueva.')
  const expected = Buffer.from(otpSignature(otpPayload(studentId, fields, fields.otp ?? '', expiresAt)))
  const received = Buffer.from(signature)
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    throw new DomainError('La clave de débito no coincide con la enviada a tu teléfono.')
  }
}

// Confirmed enrollment of the student in a term, the only kind that can be paid.
async function findPayableEnrollment(studentId: string, termId: string) {
  const enrollment = await findEnrollment(studentId, termId)
  if (!enrollment || enrollment.status !== 'CONFIRMED') throw new DomainError('Solo puedes pagar un período en el que estás inscrito.')
  return enrollment
}

// Simulated immediate debit: sends (shows) an 8-digit authorization code for the payer's bank, phone and ID.
export async function requestDebitOtp(input: DebitOtpInput): Promise<DebitOtpResult> {
  const parsed = debitOtpSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }
  try {
    const { profile } = await getStudentContext()
    await findPayableEnrollment(profile.id, parsed.data.termId)
    const checked = checkPaymentDetails('IMMEDIATE_DEBIT', { ...parsed.data.fields, otp: '00000000' }, new Date())
    if (checked.errors.length) return { ok: false, message: checked.errors.join(' ') }
    const code = String(randomInt(0, 100_000_000)).padStart(8, '0')
    const expiresAt = Date.now() + OTP_TTL_MS
    const token = `${expiresAt}.${otpSignature(otpPayload(profile.id, parsed.data.fields, code, expiresAt))}`
    return { ok: true, message: `Enviamos una clave de débito al ${checked.details.phone}. Vence en 5 minutos.`, smsCode: code, otpToken: token }
  } catch (error) {
    if (error instanceof DomainError) return { ok: false, message: error.message }
    throw error
  }
}

// Registers a payment (full or partial) of an enrolled term. The data reported for the method is checked, bolívar
// methods are converted at the BCV rate read on the server, and the amount can never exceed the balance.
export async function registerPayment(input: RegisterPaymentInput): Promise<PaymentActionResult> {
  const parsed = registerPaymentSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }
  const { termId, method, fields, otpToken } = parsed.data
  const amount = Number(parsed.data.amount.replace(',', '.'))

  try {
    const { profile } = await getStudentContext()
    const enrollment = await findPayableEnrollment(profile.id, termId)
    const info = findPaymentMethod(method)!
    const checked = checkPaymentDetails(method, fields, new Date())
    if (checked.errors.length) return { ok: false, message: checked.errors.join(' ') }
    if (method === 'IMMEDIATE_DEBIT') verifyOtp(profile.id, fields, otpToken)

    let exchangeRate: number | null = null
    let paidAmount = amount
    if (info.currency === 'VES') {
      const bcv = await getBcvUsdRate()
      if (!bcv) throw new DomainError('No pudimos obtener la tasa del BCV. Intenta en unos minutos o paga con un método en divisas.')
      exchangeRate = bcv.rate
      paidAmount = toBolivares(amount, bcv.rate)
    }
    // Card and debit payments get the authorization code the platform would return.
    const details = { ...checked.details }
    if (method === 'ONLINE_CARD' || method === 'IMMEDIATE_DEBIT') details.authorization = String(randomInt(100_000, 1_000_000))

    let remaining = 0
    const reference = `PAY-${enrollment.term.name}-${randomBytes(4).toString('hex').toUpperCase()}`
    const result = await recordPayment(
      {
        enrollmentId: enrollment.id,
        reference,
        method,
        currency: info.currency,
        amount,
        paidAmount,
        exchangeRate,
        payerReference: checked.payerReference,
        details,
      },
      (state) => {
        if (state.status !== 'CONFIRMED') throw new DomainError('Solo puedes pagar un período en el que estás inscrito.')
        const { balance } = summarizeBalance(
          state.amount,
          state.approvedPayments.map((value) => ({ amount: value, status: 'APPROVED' })),
        )
        validatePaymentAmount(amount, balance)
        remaining = Math.round((balance - amount) * 100) / 100
      },
    )
    if (!result.ok) {
      return {
        ok: false,
        message:
          result.reason === 'duplicate-reference'
            ? `La referencia ${checked.payerReference} ya fue registrada en otro pago con ${info.label}. Revisa el comprobante.`
            : 'No se encontró tu inscripción. Recarga la página.',
      }
    }
    revalidatePath('/student', 'layout')
    const settled = remaining <= 0
    return {
      ok: true,
      reference,
      message: settled
        ? `Pago registrado. El período ${enrollment.term.name} quedó pagado en su totalidad.`
        : `Pago registrado: abonaste US$ ${amount.toFixed(2)}. Saldo pendiente del período ${enrollment.term.name}: US$ ${remaining.toFixed(2)}.`,
    }
  } catch (error) {
    if (error instanceof DomainError) return { ok: false, message: error.message }
    throw error
  }
}
