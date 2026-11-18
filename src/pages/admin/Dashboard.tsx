import { Link } from 'react-router-dom'
import { ArrowUpRight, Bike, DollarSign, ShoppingBag, TrendingUp, Users } from 'lucide-react'
import { AdminCard, Bar, Kpi } from '@/components/admin/AdminBits'
import { Pill } from '@/components/ui/Badge'
import { ORDER_STATUS_EMOJI, ORDER_STATUS_LABEL } from '@/services/api'
import { money, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDb } from '@/store/db'

export default function Dashboard() {
  const orders = useDb((s) => s.orders)
  const users = useDb((s) => s.users)
  const products = useDb((s) => s.products)
  const reviews = useDb((s) => s.reviews)

  const paid = orders.filter((o) => o.status !== 'cancelled')
  const revenue = paid.reduce((a, o) => a + o.total, 0)
  const avgTicket = paid.length ? revenue / paid.length : 0
  const activeOrders = orders.filter(
    (o) => !['delivered', 'cancelled'].includes(o.status),
  )

  const topProducts = products
    .map((product) => {
      const count = orders
        .flatMap((o) => o.items)
        .filter((item) => item.productId === product.id)
        .reduce((a, item) => a + item.quantity, 0)
      return { product, count }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const maxCount = topProducts[0]?.count ?? 1

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Ventas"
          value={money(revenue)}
          hint={`${paid.length} pedidos pagados`}
          icon={<DollarSign className="size-4" />}
        />
        <Kpi
          label="Ticket promedio"
          value={money(avgTicket)}
          hint="Por pedido"
          tone="lime"
          icon={<TrendingUp className="size-4" />}
        />
        <Kpi
          label="En curso"
          value={String(activeOrders.length)}
          hint="Pedidos sin entregar"
          tone="flame"
          icon={<Bike className="size-4" />}
        />
        <Kpi
          label="Clientes"
          value={String(users.length)}
          hint={`${reviews.length} reseñas`}
          tone="yellow"
          icon={<Users className="size-4" />}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <AdminCard
          title="Pedidos recientes"
          subtitle="Últimos movimientos de la operación"
          action={
            <Link
              to="/admin/orders"
              className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-red"
            >
              Ver todos <ArrowUpRight className="size-3" />
            </Link>
          }
          padded={false}
        >
          {orders.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-concrete">
              Todavía no hay pedidos. Cuando entren, aparecerán aquí en vivo.
            </p>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {orders.slice(0, 6).map((order) => (
                <li key={order.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-base">
                    {ORDER_STATUS_EMOJI[order.status]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-bone">{order.code}</span>
                    <span className="block truncate text-[11px] text-ash">
                      {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-xs font-bold text-red">{money(order.total)}</span>
                    <span className="block text-[10px] text-concrete">
                      {timeAgo(order.createdAt)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <AdminCard title="Productos más vendidos" subtitle="Por unidades pedidas">
          {topProducts.every((entry) => entry.count === 0) ? (
            <p className="py-6 text-center text-xs text-concrete">
              Aún sin datos de ventas. Los productos aparecerán al recibir pedidos.
            </p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((entry, index) => (
                <Bar
                  key={entry.product.id}
                  label={`${index + 1}. ${entry.product.name}`}
                  value={entry.count}
                  max={maxCount}
                  tone={index === 0 ? 'volt' : 'yellow'}
                />
              ))}
            </div>
          )}
        </AdminCard>
      </div>

      <AdminCard title="Estado de la operación" subtitle="Pedidos por etapa">
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {(['received', 'confirmed', 'preparing', 'ready', 'on_the_way', 'delivered'] as const).map(
            (status) => {
              const count = orders.filter((o) => o.status === status).length
              return (
                <div
                  key={status}
                  className={cn(
                    'rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3 text-center',
                    count > 0 && 'border-red/30 bg-red/[0.06]',
                  )}
                >
                  <span className="text-lg">{ORDER_STATUS_EMOJI[status]}</span>
                  <p className="mt-1 font-display text-xl text-bone">{count}</p>
                  <p className="text-[10px] uppercase tracking-wider text-concrete">
                    {ORDER_STATUS_LABEL[status]}
                  </p>
                </div>
              )
            },
          )}
        </div>
      </AdminCard>

      <AdminCard title="Integraciones" subtitle="Estado de la arquitectura">
        <ul className="space-y-2">
          {[
            { label: 'ePayco (tarjetas, PSE, Nequi, Daviplata)', status: 'Listo para conectar', tone: 'volt' as const },
            { label: 'Backend / API REST', status: 'Contrato definido', tone: 'yellow' as const },
            { label: 'Base de datos (Supabase/Postgres)', status: 'Modelo definido', tone: 'yellow' as const },
            { label: 'Notificaciones push', status: 'Pendiente', tone: 'flame' as const },
            { label: 'Mapas y tracking GPS', status: 'Pendiente', tone: 'flame' as const },
          ].map((item) => (
            <li
              key={item.label}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5"
            >
              <span className="flex items-center gap-2 text-xs text-ash">
                <ShoppingBag className="size-3.5 text-concrete" /> {item.label}
              </span>
              <Pill tone={item.tone}>{item.status}</Pill>
            </li>
          ))}
        </ul>
      </AdminCard>
    </div>
  )
}
