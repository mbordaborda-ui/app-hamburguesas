import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, FileText, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Feedback'
import { ORDER_STATUS_EMOJI, ORDER_STATUS_LABEL } from '@/services/api'
import { money, timeAgo } from '@/lib/format'
import { orderToLines } from '@/lib/habits'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/auth'
import { useCart } from '@/store/cart'
import { useDb } from '@/store/db'
import { toast } from '@/store/ui'

export default function Orders() {
  const user = useAuth((s) => s.user)
  const orders = useDb((s) => s.orders)
  const loadLines = useCart((s) => s.loadLines)
  const navigate = useNavigate()

  const mine = orders.filter((o) => (user ? o.userId === user.id : true))

  if (mine.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          emoji="📦"
          title="Aún no tienes pedidos"
          description="Cuando hagas tu primer pedido aparecerá aquí con su seguimiento."
          action={<Button onClick={() => navigate('/menu')}>Pedir algo rico</Button>}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <header className="mb-5">
        <p className="font-marker text-sm text-red">Tu historial</p>
        <h1 className="font-display text-2xl text-bone sm:text-3xl">Mis pedidos</h1>
        <p className="mt-0.5 text-xs text-ash">
          {mine.length} pedidos · {money(mine.reduce((a, o) => a + o.total, 0))} en total
        </p>
      </header>

      <ul className="space-y-3">
        {mine.map((order) => (
          <li key={order.id}>
            <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-carbon">
              <Link
                to={`/tracking/${order.id}`}
                className="flex items-center gap-3 p-4 transition hover:bg-white/[0.02]"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/[0.05] text-xl">
                  {ORDER_STATUS_EMOJI[order.status]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-display text-sm text-bone">{order.code}</span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                        order.status === 'delivered'
                          ? 'bg-lime/15 text-lime'
                          : order.status === 'cancelled'
                            ? 'bg-flame/15 text-flame'
                            : 'bg-red/15 text-red',
                      )}
                    >
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-ash">
                    {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-concrete">
                    {timeAgo(order.createdAt)} · {money(order.total)}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-concrete" />
              </Link>

              <div className="flex gap-2 border-t border-white/[0.06] px-4 py-3">
                <Button
                  size="sm"
                  variant="outline"
                  icon={<RotateCcw className="size-3.5" />}
                  onClick={() => {
                    loadLines(orderToLines(order.items))
                    toast({ title: 'Pedido repetido', description: order.code, emoji: '🔁', tone: 'success' })
                    navigate('/cart')
                  }}
                >
                  Pedir de nuevo
                </Button>
                <Link
                  to={`/invoice/${order.id}`}
                  className="flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold uppercase tracking-wide text-ash transition hover:text-red"
                >
                  <FileText className="size-3.5" /> Factura
                </Link>
                <Link
                  to={`/tracking/${order.id}`}
                  className="flex h-9 items-center rounded-xl px-3 text-xs font-bold uppercase tracking-wide text-ash transition hover:text-red"
                >
                  Seguir pedido
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
