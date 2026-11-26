// Payment methods accepted for the enrollment fee and the data each one needs to be checked against the bank or
// platform statement. Bolívar methods go through Mercantil and are charged at the BCV rate of the day; foreign
// currency methods are charged in US dollars (USDT 1:1 for Binance Pay). All destination accounts are simulated.

export type PaymentMethodId =
  | 'PAGO_MOVIL'
  | 'BANK_TRANSFER_VES'
  | 'IMMEDIATE_DEBIT'
  | 'ONLINE_CARD'
  | 'ZELLE'
  | 'BINANCE_PAY'
  | 'US_BANK_TRANSFER'

export type PaymentCurrencyId = 'VES' | 'USD' | 'USDT'

export interface PaymentField {
  name: string
  label: string
  placeholder?: string
  hint?: string
  type?: 'text' | 'date' | 'select' | 'password'
  options?: { value: string; label: string }[]
  inputMode?: 'numeric' | 'email' | 'tel' | 'text'
}

export interface PaymentMethodInfo {
  id: PaymentMethodId
  label: string
  currency: PaymentCurrencyId
  // Data the student uses to send the money.
  destination: { label: string; value: string }[]
  fields: PaymentField[]
}

// Bank codes of the Venezuelan payment system (Sudeban), used by Pago Móvil, transfers and immediate debit.
export const VENEZUELAN_BANKS = [
  { value: '0102', label: '0102 · Banco de Venezuela' },
  { value: '0104', label: '0104 · Venezolano de Crédito' },
  { value: '0105', label: '0105 · Mercantil' },
  { value: '0108', label: '0108 · BBVA Provincial' },
  { value: '0114', label: '0114 · Bancaribe' },
  { value: '0115', label: '0115 · Banco Exterior' },
  { value: '0128', label: '0128 · Banco Caroní' },
  { value: '0134', label: '0134 · Banesco' },
  { value: '0137', label: '0137 · Sofitasa' },
  { value: '0138', label: '0138 · Banco Plaza' },
  { value: '0151', label: '0151 · BFC Banco Fondo Común' },
  { value: '0156', label: '0156 · 100% Banco' },
  { value: '0163', label: '0163 · Banco del Tesoro' },
  { value: '0166', label: '0166 · Banco Agrícola de Venezuela' },
  { value: '0168', label: '0168 · Bancrecer' },
  { value: '0169', label: '0169 · R4 Banco Microfinanciero' },
  { value: '0171', label: '0171 · Banco Activo' },
  { value: '0172', label: '0172 · Bancamiga' },
  { value: '0174', label: '0174 · Banplus' },
  { value: '0175', label: '0175 · Banco Digital de los Trabajadores' },
  { value: '0177', label: '0177 · Banfanb' },
  { value: '0191', label: '0191 · Banco Nacional de Crédito' },
]

const bankField: PaymentField = { name: 'bank', label: 'Banco emisor', type: 'select', options: VENEZUELAN_BANKS }
const idField: PaymentField = { name: 'idNumber', label: 'Cédula o RIF del titular', placeholder: 'V-12345678', inputMode: 'text' }
const phoneField: PaymentField = { name: 'phone', label: 'Teléfono afiliado', placeholder: '0414-1234567', inputMode: 'tel' }
const dateField: PaymentField = { name: 'date', label: 'Fecha del pago', type: 'date' }

export const PAYMENT_METHODS: PaymentMethodInfo[] = [
  {
    id: 'PAGO_MOVIL',
    label: 'Pago Móvil',
    currency: 'VES',
    destination: [
      { label: 'Banco', value: '0105 · Mercantil' },
      { label: 'Teléfono', value: '0414-0000105' },
      { label: 'RIF', value: 'J-00000000-0' },
    ],
    fields: [
      bankField,
      phoneField,
      idField,
      { name: 'reference', label: 'Número de referencia', placeholder: '000123456', hint: 'Entre 6 y 12 dígitos, como aparece en el comprobante.', inputMode: 'numeric' },
      dateField,
    ],
  },
  {
    id: 'BANK_TRANSFER_VES',
    label: 'Transferencia en bolívares',
    currency: 'VES',
    destination: [
      { label: 'Banco', value: 'Mercantil · cuenta corriente' },
      { label: 'Cuenta', value: '0105-0000-00-0000000000' },
      { label: 'Titular', value: 'Universidad Metropolitana · J-00000000-0' },
    ],
    fields: [
      bankField,
      idField,
      { name: 'reference', label: 'Número de referencia', placeholder: '000123456', hint: 'Entre 6 y 12 dígitos.', inputMode: 'numeric' },
      dateField,
    ],
  },
  {
    id: 'IMMEDIATE_DEBIT',
    label: 'Débito inmediato',
    currency: 'VES',
    destination: [
      { label: 'Cobro', value: 'Mercantil a favor de Universidad Metropolitana' },
      { label: 'Autorización', value: 'Clave de 8 dígitos enviada por SMS (simulado)' },
    ],
    fields: [bankField, phoneField, idField, { name: 'otp', label: 'Clave de débito (SMS)', placeholder: '12345678', inputMode: 'numeric' }],
  },
  {
    id: 'ONLINE_CARD',
    label: 'Pago en línea con tarjeta',
    currency: 'VES',
    destination: [{ label: 'Botón de pago', value: 'Mercantil · tarjetas de débito y crédito nacionales' }],
    fields: [
      { name: 'cardNumber', label: 'Número de tarjeta', placeholder: '4111 1111 1111 1111', inputMode: 'numeric' },
      { name: 'cardHolder', label: 'Titular de la tarjeta', placeholder: 'Como aparece en la tarjeta' },
      { name: 'expiry', label: 'Vencimiento', placeholder: 'MM/AA', inputMode: 'numeric' },
      { name: 'cvv', label: 'CVV', placeholder: '123', type: 'password', inputMode: 'numeric' },
      idField,
    ],
  },
  {
    id: 'ZELLE',
    label: 'Zelle',
    currency: 'USD',
    destination: [
      { label: 'Correo Zelle', value: 'pagos.sirius@example.com' },
      { label: 'Titular', value: 'Universidad Metropolitana' },
    ],
    fields: [
      { name: 'holderName', label: 'Titular de la cuenta Zelle', placeholder: 'Nombre y apellido' },
      { name: 'zelleContact', label: 'Correo o teléfono Zelle del titular', placeholder: 'correo@ejemplo.com', inputMode: 'email' },
      { name: 'reference', label: 'Número de confirmación', placeholder: 'Ej. 9AB12CD34', hint: 'Lo muestra tu banco al enviar el Zelle.' },
      dateField,
    ],
  },
  {
    id: 'BINANCE_PAY',
    label: 'Binance Pay (USDT)',
    currency: 'USDT',
    destination: [
      { label: 'Binance Pay ID', value: '000000000' },
      { label: 'Nombre', value: 'Sirius UNIMET' },
    ],
    fields: [
      { name: 'payerId', label: 'Tu Binance Pay ID o correo', placeholder: '123456789' },
      { name: 'reference', label: 'ID de la orden', placeholder: '305123456789012345', hint: 'Entre 15 y 20 dígitos, en el historial de Binance Pay.', inputMode: 'numeric' },
      dateField,
    ],
  },
  {
    id: 'US_BANK_TRANSFER',
    label: 'Transferencia bancaria (EE. UU.)',
    currency: 'USD',
    destination: [
      { label: 'Banco', value: 'Bank of Example, N.A.' },
      { label: 'Cuenta', value: '000000000000 · Checking' },
      { label: 'Routing (ABA)', value: '000000000' },
      { label: 'SWIFT', value: 'EXAMUS00' },
    ],
    fields: [
      { name: 'bankName', label: 'Banco emisor', placeholder: 'Ej. Chase' },
      { name: 'holderName', label: 'Titular de la cuenta', placeholder: 'Nombre y apellido' },
      { name: 'accountLast4', label: 'Últimos 4 dígitos de tu cuenta', placeholder: '1234', inputMode: 'numeric' },
      {
        name: 'transferType',
        label: 'Tipo',
        type: 'select',
        options: [
          { value: 'ACH', label: 'ACH' },
          { value: 'WIRE', label: 'Wire' },
        ],
      },
      { name: 'reference', label: 'Número de confirmación o trace', placeholder: 'Ej. 021000020123456' },
      dateField,
    ],
  },
]

export function findPaymentMethod(id: string) {
  return PAYMENT_METHODS.find((method) => method.id === id) ?? null
}

export const isBolivarMethod = (id: PaymentMethodId) => findPaymentMethod(id)?.currency === 'VES'

const round2 = (value: number) => Math.round(value * 100) / 100

// Amount in bolívares for a USD amount at the BCV rate (Bs per USD), rounded to cents.
export function toBolivares(usd: number, rate: number) {
  return round2(usd * rate)
}

// Dollars credited for a payment made in bolívares at the given BCV rate, rounded to cents.
export function toDollars(bolivares: number, rate: number) {
  return round2(bolivares / rate)
}

const VE_PHONE = /^04(12|14|16|22|24|26)\d{7}$/
const VE_ID = /^[VEJPG]\d{6,9}$/
const DIGITS = (min: number, max: number) => new RegExp(`^\\d{${min},${max}}$`)
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const US_PHONE = /^(\+?1)?\d{10}$/

const normalizePhone = (value: string) => value.replace(/[\s().-]/g, '')
const normalizeId = (value: string) => value.toUpperCase().replace(/[\s.-]/g, '')

// Luhn checksum used by every card network.
export function isValidCardNumber(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.length < 13 || digits.length > 19) return false
  let sum = 0
  for (let index = 0; index < digits.length; index++) {
    let digit = Number(digits[digits.length - 1 - index])
    if (index % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

export function cardBrand(value: string) {
  const digits = value.replace(/\D/g, '')
  if (/^4/.test(digits)) return 'Visa'
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard'
  if (/^3[47]/.test(digits)) return 'American Express'
  return 'Tarjeta'
}

// A card is valid through the last day of its expiry month.
export function isCardExpired(expiry: string, today: Date) {
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry.trim())
  if (!match) return true
  const month = Number(match[1])
  if (month < 1 || month > 12) return true
  const endOfMonth = Date.UTC(2000 + Number(match[2]), month, 1)
  return today.getTime() >= endOfMonth
}

// Payments can be reported up to 30 days after they were made, never with a future date.
export const MAX_PAYMENT_AGE_DAYS = 30

function dateError(value: string, today: Date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'La fecha del pago no es válida.'
  const date = Date.parse(`${value}T00:00:00Z`)
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  if (Number.isNaN(date)) return 'La fecha del pago no es válida.'
  if (date > todayUtc + 86_400_000) return 'La fecha del pago no puede ser futura.'
  if (todayUtc - date > MAX_PAYMENT_AGE_DAYS * 86_400_000) return `La fecha del pago no puede tener más de ${MAX_PAYMENT_AGE_DAYS} días.`
  return null
}

export interface CheckedPayment {
  errors: string[]
  // Reference reported by the payer, unique per method; null when the platform issues it (debit, card).
  payerReference: string | null
  // Data kept with the payment, masked where sensitive.
  details: Record<string, string>
}

const bankLabel = (code: string) => VENEZUELAN_BANKS.find((bank) => bank.value === code)?.label ?? null

// Checks the data a student reports for a payment method and returns what is stored. Card numbers and CVV are never
// stored: only the brand and last four digits.
export function checkPaymentDetails(method: PaymentMethodId, raw: Record<string, string>, today: Date): CheckedPayment {
  const value = (name: string) => (raw[name] ?? '').trim()
  const errors: string[] = []
  const details: Record<string, string> = {}
  let payerReference: string | null = null

  const requireBank = () => {
    const label = bankLabel(value('bank'))
    if (!label) errors.push('Elige el banco emisor.')
    else details.bank = label
  }
  const requirePhone = () => {
    const phone = normalizePhone(value('phone'))
    if (!VE_PHONE.test(phone)) errors.push('El teléfono debe ser un número móvil venezolano, por ejemplo 0414-1234567.')
    else details.phone = `${phone.slice(0, 4)}-***${phone.slice(-4)}`
  }
  const requireId = () => {
    const id = normalizeId(value('idNumber'))
    if (!VE_ID.test(id)) errors.push('La cédula o RIF debe tener una letra (V, E, J, P o G) y entre 6 y 9 dígitos.')
    else details.idNumber = `${id[0]}-${id.slice(1)}`
  }
  const requireDate = () => {
    const error = dateError(value('date'), today)
    if (error) errors.push(error)
    else details.date = value('date')
  }
  const requireReference = (pattern: RegExp, message: string) => {
    const reference = value('reference').toUpperCase().replace(/\s/g, '')
    if (!pattern.test(reference)) errors.push(message)
    else payerReference = reference
  }

  switch (method) {
    case 'PAGO_MOVIL':
      requireBank()
      requirePhone()
      requireId()
      requireReference(DIGITS(6, 12), 'La referencia del Pago Móvil debe tener entre 6 y 12 dígitos.')
      requireDate()
      break
    case 'BANK_TRANSFER_VES':
      requireBank()
      requireId()
      requireReference(DIGITS(6, 12), 'La referencia de la transferencia debe tener entre 6 y 12 dígitos.')
      requireDate()
      break
    case 'IMMEDIATE_DEBIT':
      requireBank()
      requirePhone()
      requireId()
      if (!DIGITS(8, 8).test(value('otp'))) errors.push('La clave de débito debe tener 8 dígitos.')
      break
    case 'ONLINE_CARD': {
      const card = value('cardNumber')
      if (!isValidCardNumber(card)) errors.push('El número de tarjeta no es válido.')
      else details.card = `${cardBrand(card)} •••• ${card.replace(/\D/g, '').slice(-4)}`
      if (value('cardHolder').length < 3) errors.push('Escribe el titular de la tarjeta.')
      else details.cardHolder = value('cardHolder')
      if (isCardExpired(value('expiry'), today)) errors.push('La tarjeta está vencida o el vencimiento no tiene el formato MM/AA.')
      if (!DIGITS(3, 4).test(value('cvv'))) errors.push('El CVV debe tener 3 o 4 dígitos.')
      requireId()
      break
    }
    case 'ZELLE': {
      if (value('holderName').length < 3) errors.push('Escribe el titular de la cuenta Zelle.')
      else details.holderName = value('holderName')
      const contact = value('zelleContact')
      if (!EMAIL.test(contact) && !US_PHONE.test(normalizePhone(contact))) errors.push('El contacto Zelle debe ser un correo o un teléfono de EE. UU.')
      else details.zelleContact = contact
      requireReference(/^[A-Z0-9]{6,20}$/, 'El número de confirmación de Zelle debe tener entre 6 y 20 letras o dígitos.')
      requireDate()
      break
    }
    case 'BINANCE_PAY': {
      const payer = value('payerId')
      if (!DIGITS(6, 12).test(payer) && !EMAIL.test(payer)) errors.push('Escribe tu Binance Pay ID (6 a 12 dígitos) o tu correo de Binance.')
      else details.payerId = payer
      requireReference(DIGITS(15, 20), 'El ID de la orden de Binance Pay debe tener entre 15 y 20 dígitos.')
      requireDate()
      break
    }
    case 'US_BANK_TRANSFER': {
      if (value('bankName').length < 2) errors.push('Escribe el banco emisor.')
      else details.bankName = value('bankName')
      if (value('holderName').length < 3) errors.push('Escribe el titular de la cuenta.')
      else details.holderName = value('holderName')
      if (!DIGITS(4, 4).test(value('accountLast4'))) errors.push('Escribe los últimos 4 dígitos de tu cuenta.')
      else details.account = `•••• ${value('accountLast4')}`
      if (!['ACH', 'WIRE'].includes(value('transferType'))) errors.push('Elige si la transferencia es ACH o Wire.')
      else details.transferType = value('transferType')
      requireReference(/^[A-Z0-9]{6,30}$/, 'El número de confirmación debe tener entre 6 y 30 letras o dígitos.')
      requireDate()
      break
    }
  }
  return { errors, payerReference, details }
}
