import { ArrowLeftRight, Bitcoin, CircleDollarSign, CreditCard, Landmark, Smartphone, Zap } from 'lucide-react'

// Icon of each payment method.
export const methodIcons: Record<string, typeof Landmark> = {
  PAGO_MOVIL: Smartphone,
  BANK_TRANSFER_VES: ArrowLeftRight,
  IMMEDIATE_DEBIT: Zap,
  ONLINE_CARD: CreditCard,
  ZELLE: CircleDollarSign,
  BINANCE_PAY: Bitcoin,
  US_BANK_TRANSFER: Landmark,
}

export const MERCANTIL_BLUE = '#1f4fa3'

// Brand color of each method; `on` is the color of an icon drawn over it.
export const methodAccents: Record<string, { color: string; on: string }> = {
  PAGO_MOVIL: { color: MERCANTIL_BLUE, on: '#ffffff' },
  BANK_TRANSFER_VES: { color: MERCANTIL_BLUE, on: '#ffffff' },
  IMMEDIATE_DEBIT: { color: MERCANTIL_BLUE, on: '#ffffff' },
  ONLINE_CARD: { color: MERCANTIL_BLUE, on: '#ffffff' },
  ZELLE: { color: '#6d1ed4', on: '#ffffff' },
  BINANCE_PAY: { color: '#f0b90b', on: '#1e2026' },
  US_BANK_TRANSFER: { color: '#0f7b62', on: '#ffffff' },
}

export const accentOf = (methodId: string) => methodAccents[methodId] ?? { color: MERCANTIL_BLUE, on: '#ffffff' }

export const currencyTags: Record<string, string> = { VES: 'Bs', USD: 'USD', USDT: 'USDT' }
