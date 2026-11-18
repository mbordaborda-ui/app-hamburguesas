import { useNavigate } from 'react-router-dom'
import { ArrowRight, RotateCcw, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Feedback'
import { CouponField } from './CouponField'
import { CartLineItem } from './CartLineItem'
import { TotalsBreakdown } from './TotalsBreakdown'
import { UpsellStrip } from './UpsellStrip'
import { money } from '@/lib/format'
import { orderToLines } from '@/lib/habits'
import { CLOSED_MESSAGE } from '@/lib/hours'
import { cn } from '@/lib/utils'
import { useCartPricing } from '@/hooks/useCartPricing'
import { useStoreStatus } from '@/hooks/useStoreStatus'
import { useAuth } from '@/store/auth'
import { useCart } from '@/store/cart'
import { useDb } from '@/store/db'
import { useUi, toast } from '@/store/ui'

export function RepeatOrderButton() {
  const user = useAuth((s) => s.user)
  const orders = useDb((s) => s.orders)
  const loadLines = useCart((s) => s.loadLines)
  const navigate = useNavigate()

  const last = orders.find((o) => (user ? o.userId === user.id : true) && o.status !== 'cancelled')
  if (!last) return null

  return (
    <button
      type="button"
      onClick={() => {
        loadLines(orderToLines(last.items))
        toast({
          title: 'Pedido repetido',
          description: `Cargamos los ${last.items.length} productos de ${last.code}`,
          emoji: '🔁',
          tone: 'success',
        })
        navigate('/cart')
      }}
      className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-red/50 active:scale-[0.99]"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red/15 text-red">
        <RotateCcw className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-extrabold uppercase tracking-wide text-bone">
          Pedir de nuevo
        </span>
        <span className="block truncate text-[11px] text-ash">
          {last.code} · {last.items.map((i) => i.name).join(', ')}
        </span>
      </span>
      <span className="text-xs font-bold text-red">{money(last.total)}</span>
    </button>
  )
}

export function CartPanel({
  onDone,
  showRepeat = true,
}: {
  onDone?: () => void
  showRepeat?: boolean
}) {
  const navigate = useNavigate()
  const lines = useCart((s) => s.lines)
  const closeCart = useUi((s) => s.closeCart)
  const { total, itemCount, subtotal } = useCartPricing()
  const status = useStoreStatus()

  if (lines.length === 0) {
    return (
      <EmptyState
        emoji="🛒"
        title="Tu carrito está vacío"
        description="¿Hambre o antojo? El parche empieza aquí."
        hint="Nadie pide solo una. Arma el tuyo."
        action={
          <Button
            onClick={() => {
              closeCart()
              onDone?.()
              navigate('/menu')
            }}
            icon={<ShoppingBag className="size-4" />}
          >
            Ver el menú
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-5">
      {showRepeat && <RepeatOrderButton />}

      <div className="divide-y divide-white/[0.06]">
        {lines.map((line) => (
          <CartLineItem key={line.id} line={line} />
        ))}
      </div>

      <UpsellStrip compact />

      <CouponField />

      <TotalsBreakdown />

      <Button
        size="lg"
        fullWidth
        disabled={!status.open}
        iconRight={<ArrowRight className="size-4" />}
        onClick={() => {
          closeCart()
          onDone?.()
          navigate('/checkout')
        }}
      >
        {status.open ? `Pedir ahora · ${money(total)}` : CLOSED_MESSAGE}
      </Button>
      <p
        className={cn(
          'text-center text-[11px]',
          status.open ? 'text-concrete' : 'font-bold text-flame',
        )}
      >
        {status.open
          ? subtotal >= 0 && itemCount > 0
            ? 'Pago seguro · Seguimiento en tiempo real'
            : ''
          : status.detail}
      </p>
    </div>
  )
}
