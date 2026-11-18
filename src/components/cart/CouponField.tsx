import { useState } from 'react'
import { Ticket, X } from 'lucide-react'
import { api } from '@/services/api'
import { money } from '@/lib/format'
import { useCart } from '@/store/cart'
import { useCartPricing } from '@/hooks/useCartPricing'
import { toast } from '@/store/ui'

export function CouponField() {
  const couponCode = useCart((s) => s.couponCode)
  const setCoupon = useCart((s) => s.setCoupon)
  const { subtotal, discount } = useCartPricing()
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)

  const apply = async () => {
    if (!value.trim()) return
    setLoading(true)
    try {
      const coupon = await api.coupons.validate(value, subtotal)
      setCoupon(coupon.code)
      toast({
        title: `Cupón ${coupon.code} aplicado`,
        description: coupon.description,
        emoji: coupon.emoji,
        tone: 'success',
      })
      setValue('')
    } catch (error) {
      toast({ title: 'No pudimos aplicar el cupón', description: (error as Error).message, tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  if (couponCode) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-lime/30 bg-lime/[0.08] px-4 py-3">
        <Ticket className="size-4 shrink-0 text-lime" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-bone">{couponCode}</p>
          <p className="text-xs text-lime">
            {discount > 0 ? `Estás ahorrando ${money(discount)}` : 'Domicilio gratis aplicado'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCoupon(null)}
          aria-label="Quitar cupón"
          className="text-concrete transition hover:text-flame"
        >
          <X className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex flex-1 items-center">
        <Ticket className="absolute left-3.5 size-4 text-ash" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
          placeholder="Código promocional"
          className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] pl-10 pr-3 text-sm font-semibold uppercase tracking-wide text-bone placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-concrete focus:border-red/70 focus:outline-none"
        />
      </div>
      <button
        type="button"
        onClick={apply}
        disabled={loading || !value.trim()}
        className="h-12 shrink-0 rounded-2xl border border-red/50 px-4 text-xs font-extrabold uppercase tracking-wider text-red transition hover:bg-red/10 disabled:opacity-40"
      >
        {loading ? '...' : 'Aplicar'}
      </button>
    </div>
  )
}
