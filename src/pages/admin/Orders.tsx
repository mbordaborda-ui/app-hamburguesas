import { Link } from 'react-router-dom'
import { ChevronRight, X } from 'lucide-react'
import { AdminCard } from '@/components/admin/AdminBits'
import { Button } from '@/components/ui/Button'
import { vehicleEmoji } from '@/data/drivers'
import { ORDER_FLOW, ORDER_STATUS_EMOJI, ORDER_STATUS_LABEL } from '@/services/api'
import { money, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDb } from '@/store/db'
import { toast } from '@/store/ui'
import type { OrderStatus } from '@/types'

const columns: OrderStatus[] = ['received', 'confirmed', 'preparing', 'ready', 'on_the_way', 'delivered']

export default function Orders() {
  const orders = useDb((s) => s.orders)
  const setOrderStatus = useDb((s) => s.setOrderStatus)
  const drivers = useDb((s) => s.drivers)
  const assignCourier = useDb((s) => s.assignCourier)

  const advance = (orderId: string, current: OrderStatus) => {
    const index = ORDER_FLOW.indexOf(current)
    const next = ORDER_FLOW[Math.min(index + 1, ORDER_FLOW.length - 1)]
    if (next === current) return
    setOrderStatus(orderId, next)
    toast({ title: 'Estado actualizado', description: ORDER_STATUS_LABEL[next], emoji: ORDER_STATUS_EMOJI[next], tone: 'success' })
  }

  return (
    <div className="space-y-5">
      <AdminCard
        title="Tablero de pedidos"
        subtitle={`${orders.length} pedidos totales · ${orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length} en curso`}
      >
        {orders.length === 0 ? (
          <p className="py-10 text-center text-xs text-concrete">
            Aún no hay pedidos. Cuando un cliente pida, aparecerá aquí.
          </p>
        ) : (
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
            {columns.map((status) => {
              const list = orders.filter((o) => o.status === status)
              return (
                <div key={status} className="w-[260px] shrink-0">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ash">
                      <span>{ORDER_STATUS_EMOJI[status]}</span>
                      {ORDER_STATUS_LABEL[status]}
                    </span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-bone">
                      {list.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {list.map((order) => (
                      <article
                        key={order.id}
                        className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3"
                      >
                        <div className="flex items-center justify-between">
                          <Link
                            to={`/tracking/${order.id}`}
                            className="text-xs font-bold text-bone hover:text-red"
                          >
                            {order.code}
                          </Link>
                          <span className="text-[10px] text-concrete">
                            {timeAgo(order.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[11px] text-ash">
                          {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-display text-sm text-red">
                            {money(order.total)}
                          </span>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                              order.paymentStatus === 'approved'
                                ? 'bg-lime/15 text-lime'
                                : 'bg-red/15 text-red',
                            )}
                          >
                            {order.paymentStatus}
                          </span>
                        </div>
                        {/* Asignar domiciliario */}
                        <select
                          value={order.courierId ?? ''}
                          onChange={(event) => {
                            const driverId = event.target.value || null
                            assignCourier(order.id, driverId)
                            const driver = drivers.find((d) => d.id === driverId)
                            toast({
                              title: driver ? 'Domiciliario asignado' : 'Sin domiciliario',
                              description: driver ? `${order.code} · ${driver.name}` : order.code,
                              emoji: '🛵',
                              tone: driver ? 'success' : 'default',
                            })
                          }}
                          className={cn(
                            'mt-2 h-8 w-full rounded-lg border bg-carbon px-2 text-[11px] font-semibold transition focus:outline-none',
                            order.courierId
                              ? 'border-orange/40 text-orange'
                              : 'border-white/10 text-concrete',
                          )}
                        >
                          <option value="">Sin domiciliario</option>
                          {drivers
                            .filter((driver) => driver.active)
                            .map((driver) => (
                              <option key={driver.id} value={driver.id}>
                                {vehicleEmoji[driver.vehicle]} {driver.name}
                              </option>
                            ))}
                        </select>

                        <div className="mt-2.5 flex gap-1.5">
                          {status !== 'delivered' && (
                            <Button
                              size="sm"
                              className="flex-1"
                              iconRight={<ChevronRight className="size-3.5" />}
                              onClick={() => advance(order.id, order.status)}
                            >
                              Avanzar
                            </Button>
                          )}
                          {status !== 'delivered' && (
                            <button
                              type="button"
                              aria-label="Cancelar pedido"
                              onClick={() => {
                                setOrderStatus(order.id, 'cancelled')
                                toast({ title: 'Pedido cancelado', description: order.code, tone: 'error' })
                              }}
                              className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/10 text-ash transition hover:border-flame/50 hover:text-flame"
                            >
                              <X className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                    {list.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-white/10 px-3 py-6 text-center text-[10px] text-concrete">
                        Sin pedidos
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </AdminCard>
    </div>
  )
}
