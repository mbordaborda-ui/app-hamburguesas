import { money } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCartPricing } from '@/hooks/useCartPricing'

export function TotalsBreakdown({
  className,
  showSavings = true,
}: {
  className?: string
  showSavings?: boolean
}) {
  const {
    subtotal,
    discount,
    pointsDiscount,
    deliveryFee,
    tip,
    total,
    freeDelivery,
    savings,
    itemCount,
    pointsEarned,
  } = useCartPricing()

  return (
    <div className={cn('space-y-2', className)}>
      <Row label={`Subtotal (${itemCount} art.)`} value={money(subtotal)} />
      {discount > 0 && <Row label="Descuento" value={`- ${money(discount)}`} tone="lime" />}
      {pointsDiscount > 0 && (
        <Row label="Street Points" value={`- ${money(pointsDiscount)}`} tone="lime" />
      )}
      <Row
        label="Domicilio"
        value={freeDelivery ? 'GRATIS' : money(deliveryFee)}
        tone={freeDelivery ? 'lime' : undefined}
      />
      {tip > 0 && <Row label="Propina repartidor" value={money(tip)} />}

      <div className="!mt-3 flex items-end justify-between border-t border-dashed border-white/15 pt-3">
        <span className="font-display text-base uppercase text-bone">Total</span>
        <span className="font-display text-2xl text-red">{money(total)}</span>
      </div>

      {showSavings && savings > 0 && (
        <p className="rounded-xl bg-lime/10 px-3 py-2 text-center text-xs font-bold text-lime">
          🎉 Estás ahorrando {money(savings)} en este pedido
        </p>
      )}
      {pointsEarned > 0 && (
        <p className="text-center text-[11px] text-ash">
          Ganarás <span className="font-bold text-red">{pointsEarned} Street Points</span> con este
          pedido
        </p>
      )}
    </div>
  )
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'lime' }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ash">{label}</span>
      <span className={cn('font-semibold text-bone', tone === 'lime' && 'text-lime')}>
        {value}
      </span>
    </div>
  )
}
