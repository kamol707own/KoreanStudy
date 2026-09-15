export const ADMIN_EMAIL = 'kamol.707.own@gmail.com'

export const PROMO_MONTHS = 2
export const PROMO_PRICE_WON = 5_000
export const FULL_PRICE_WON = 10_000
export const GRANT_DAYS = 30

export const DISCOUNTS = [30, 50, 70, 100] as const
export type CouponDiscount = (typeof DISCOUNTS)[number]

/** Base price for a given purchase (month 1-2 = promo, later = full). */
export function priceForMonth(planMonth: number): number {
  return planMonth <= PROMO_MONTHS ? PROMO_PRICE_WON : FULL_PRICE_WON
}

/** Apply a percent discount, rounded to the nearest 100 won. */
export function discountedPrice(base: number, discountPercent: number): number {
  const raw = (base * (100 - discountPercent)) / 100
  return Math.round(raw / 100) * 100
}

export function formatWon(amount: number): string {
  return `${amount.toLocaleString()} won`
}

/** Mask a card number for display, keeping only the last 4 digits. */
export function maskCard(cardNumber: string | null | undefined): string {
  if (!cardNumber) return '—'
  const digits = cardNumber.replace(/\D/g, '')
  if (digits.length < 4) return cardNumber
  return `•••• •••• •••• ${digits.slice(-4)}`
}

export interface AccessState {
  hasAccess: boolean
  expiresAt: string | null
  planMonth: number
  nextPrice: number
  pendingOrder: {
    id: string
    amount: number
    couponDiscount: number | null
    createdAt: string
  } | null
}