import type { CartLine, Coupon, Settings } from '@/types'

export interface PricingInput {
  lines: CartLine[]
  coupon?: Coupon | null
  pointsRedeemed?: number
  tip?: number
  deliveryMode?: 'delivery' | 'pickup'
  settings: Settings
}

export interface PricingResult {
  subtotal: number
  discount: number
  pointsDiscount: number
  deliveryFee: number
  tip: number
  total: number
  freeDelivery: boolean
  pointsEarned: number
  savings: number
  itemCount: number
}

export const lineTotal = (line: CartLine) => line.unitPrice * line.quantity

export const cartSubtotal = (lines: CartLine[]) => lines.reduce((acc, l) => acc + lineTotal(l), 0)

export const cartCount = (lines: CartLine[]) => lines.reduce((acc, l) => acc + l.quantity, 0)

export const couponDiscount = (subtotal: number, coupon: Coupon | null | undefined) => {
  if (!coupon || !coupon.active) return 0
  if (subtotal < coupon.minSubtotal) return 0
  if (coupon.type === 'percent') {
    const raw = (subtotal * coupon.value) / 100
    return Math.round(coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw)
  }
  if (coupon.type === 'fixed') return Math.min(coupon.value, subtotal)
  return 0
}

export const computePricing = ({
  lines,
  coupon,
  pointsRedeemed = 0,
  tip = 0,
  deliveryMode = 'delivery',
  settings,
}: PricingInput): PricingResult => {
  const subtotal = cartSubtotal(lines)
  const discount = couponDiscount(subtotal, coupon)
  const pointsDiscount = Math.min(subtotal - discount, pointsRedeemed * settings.pointsValue)

  const qualifiesFree = subtotal - discount >= settings.freeDeliveryFrom
  const freeDelivery = deliveryMode === 'pickup' || qualifiesFree || coupon?.type === 'free_delivery'
  const deliveryFee = deliveryMode === 'pickup' ? 0 : freeDelivery ? 0 : settings.deliveryFee

  const total = Math.max(0, subtotal - discount - pointsDiscount + deliveryFee + tip)

  const pointsEarned = Math.floor(total / settings.pointsPerCurrency)

  return {
    subtotal,
    discount,
    pointsDiscount,
    deliveryFee,
    tip,
    total,
    freeDelivery,
    pointsEarned,
    savings: discount + pointsDiscount + (freeDelivery && deliveryMode === 'delivery' ? settings.deliveryFee : 0),
    itemCount: cartCount(lines),
  }
}
