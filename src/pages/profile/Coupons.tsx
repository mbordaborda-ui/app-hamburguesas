import { useNavigate } from 'react-router-dom'
import { Copy, Ticket } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Feedback'
import { countdown, money } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCart } from '@/store/cart'
import { useDb } from '@/store/db'
import { toast } from '@/store/ui'

export default function Coupons() {
  const coupons = useDb((s) => s.coupons)
  const setCoupon = useCart((s) => s.setCoupon)
  const navigate = useNavigate()

  const active = coupons.filter((c) => c.active && new Date(c.expiresAt).getTime() > Date.now())
  const expired = coupons.filter((c) => !c.active || new Date(c.expiresAt).getTime() <= Date.now())

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <PageHeader
        eyebrow="Ahorra"
        title="Cupones y promos"
        description="Aplica un código al instante o guárdalo para después."
      />

      {active.length === 0 ? (
        <EmptyState emoji="🎟️" title="No hay cupones activos" description="Vuelve pronto, siempre tenemos algo." />
      ) : (
        <ul className="space-y-3">
          {active.map((coupon) => (
            <li
              key={coupon.id}
              className="relative overflow-hidden rounded-3xl border border-dashed border-red/35 bg-gradient-to-br from-red/[0.08] to-carbon p-4"
            >
              <div className="absolute -left-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-ink" />
              <div className="absolute -right-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-ink" />
              <div className="flex items-start gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/[0.06] text-2xl">
                  {coupon.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-lg tracking-wide text-red">{coupon.code}</p>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ash">
                      {coupon.type === 'percent'
                        ? `${coupon.value}% off`
                        : coupon.type === 'fixed'
                          ? `${money(coupon.value)} off`
                          : 'Domicilio gratis'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-ash">{coupon.description}</p>
                  <p className="mt-1 text-[11px] text-concrete">
                    Desde {money(coupon.minSubtotal)} · vence en {countdown(coupon.expiresAt)}
                  </p>
                  <p className="mt-1 text-[11px] text-concrete">{coupon.conditions}</p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setCoupon(coupon.code)
                    toast({ title: 'Cupón aplicado', description: coupon.code, emoji: coupon.emoji, tone: 'success' })
                    navigate('/cart')
                  }}
                >
                  Usar ahora
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(coupon.code)
                    toast({ title: 'Código copiado', description: coupon.code, emoji: '📋' })
                  }}
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-white/10 px-3 text-[11px] font-bold uppercase tracking-wider text-ash transition hover:border-red/50 hover:text-red"
                >
                  <Copy className="size-3" /> Copiar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {expired.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-concrete">
            <Ticket className="size-3.5" /> Expirados
          </h2>
          <ul className="space-y-2">
            {expired.map((coupon) => (
              <li
                key={coupon.id}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-carbon/50 p-3 opacity-60',
                )}
              >
                <span className="text-lg grayscale">{coupon.emoji}</span>
                <span className="flex-1 text-xs font-bold uppercase tracking-wide text-ash line-through">
                  {coupon.code}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-concrete">Expirado</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
