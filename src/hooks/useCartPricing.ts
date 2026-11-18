import { useMemo } from 'react'
import { computePricing } from '@/lib/pricing'
import { useCart } from '@/store/cart'
import { useDb } from '@/store/db'
import type { Coupon } from '@/types'

export function useCartPricing() {
  const lines = useCart((s) => s.lines)
  const couponCode = useCart((s) => s.couponCode)
  const pointsRedeemed = useCart((s) => s.pointsRedeemed)
  const tip = useCart((s) => s.tip)
  const deliveryMode = useCart((s) => s.deliveryMode)
  const settings = useDb((s) => s.settings)
  const coupons = useDb((s) => s.coupons)

  const coupon: Coupon | null = useMemo(
    () => (couponCode ? coupons.find((c) => c.code === couponCode) ?? null : null),
    [couponCode, coupons],
  )

  const pricing = useMemo(
    () => computePricing({ lines, coupon, pointsRedeemed, tip, deliveryMode, settings }),
    [lines, coupon, pointsRedeemed, tip, deliveryMode, settings],
  )

  return { ...pricing, lines, coupon, couponCode, pointsRedeemed, tip, deliveryMode }
}
