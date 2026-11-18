import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BadgeCheck,
  Bike,
  CheckCircle2,
  Clock,
  Hand,
  MapPin,
  Navigation,
  Package,
  Phone,
  Star,
  Wallet,
} from 'lucide-react'
import { vehicleEmoji, vehicleLabel } from '@/data/drivers'
import { ORDER_STATUS_EMOJI, ORDER_STATUS_LABEL } from '@/services/api'
import { money, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/auth'
import { useDb } from '@/store/db'
import { toast } from '@/store/ui'
import type { Order, OrderStatus } from '@/types'

/** Estados en los que el domiciliario todavía tiene que actuar. */
const IN_PROGRESS: OrderStatus[] = ['received', 'confirmed', 'preparing', 'ready', 'on_the_way']
/** Estados de un pedido listo para que alguien lo tome. */
const TAKEABLE: OrderStatus[] = ['confirmed', 'preparing', 'ready']

export default function DeliveryBoard() {
  const user = useAuth((s) => s.user)
  const drivers = useDb((s) => s.drivers)
  const orders = useDb((s) => s.orders)
  const assignCourier = useDb((s) => s.assignCourier)
  const setOrderStatus = useDb((s) => s.setOrderStatus)
  const pushNotification = useDb((s) => s.pushNotification)

  const me = drivers.find((d) => d.email.toLowerCase() === (user?.email ?? '').toLowerCase())

  const { active, done, available } = useMemo(() => {
    if (!me) return { active: [] as Order[], done: [] as Order[], available: [] as Order[] }
    const mine = orders.filter((o) => o.courierId === me.id && o.status !== 'cancelled')
    return {
      active: mine.filter((o) => IN_PROGRESS.includes(o.status)),
      done: mine.filter((o) => o.status === 'delivered'),
      available: orders.filter(
        (o) =>
          !o.courierId &&
          o.deliveryMode === 'delivery' &&
          TAKEABLE.includes(o.status),
      ),
    }
  }, [orders, me])

  if (!me) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
        <p className="text-4xl">🛵</p>
        <h1 className="mt-3 font-display text-2xl text-bone">Cuenta sin domiciliario</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-ash">
          Tu correo no está registrado como domiciliario. Pídele al administrador que te agregue al
          equipo.
        </p>
        <Link
          to="/"
          className="mt-5 inline-block font-display text-sm uppercase tracking-wide text-red"
        >
          Volver al inicio
        </Link>
      </div>
    )
  }

  const startTrip = (order: Order) => {
    setOrderStatus(order.id, 'on_the_way')
    pushNotification({
      type: 'order',
      title: `Pedido ${order.code} en camino`,
      body: `${me.name} va pa' tu casa.`,
      emoji: '🛵',
      actionUrl: `/tracking/${order.id}`,
    })
    toast({ title: 'Viaje iniciado', description: order.code, emoji: '🛵', tone: 'success' })
  }

  const deliver = (order: Order) => {
    setOrderStatus(order.id, 'delivered')
    pushNotification({
      type: 'order',
      title: `Pedido ${order.code} entregado`,
      body: '¡Buen provecho, parce!',
      emoji: '🍔',
      actionUrl: `/tracking/${order.id}`,
    })
    toast({ title: 'Pedido entregado', description: order.code, emoji: '✅', tone: 'success' })
  }

  const take = (order: Order) => {
    assignCourier(order.id, me.id)
    toast({ title: 'Pedido tomado', description: order.code, emoji: '🤝', tone: 'success' })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6">
      {/* ------------------------------ CABECERA ------------------------------ */}
      <header className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-red/[0.08] via-carbon to-carbon p-5">
        <div className="texture-brick absolute inset-0 opacity-15" />
        <div className="relative flex items-center gap-4">
          <span className="relative shrink-0">
            <img
              src={me.photo}
              alt={me.name}
              className="size-16 rounded-2xl border-2 border-red/40 object-cover"
            />
            <span className="absolute -bottom-1.5 -right-1.5 grid size-7 place-items-center rounded-full border-2 border-carbon bg-red text-xs">
              {vehicleEmoji[me.vehicle]}
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[11px] uppercase tracking-[0.2em] text-orange">
              Módulo domiciliario
            </p>
            <h1 className="truncate font-display text-2xl text-bone">{me.name}</h1>
            <p className="flex items-center gap-2 text-xs text-ash">
              <Star className="size-3 fill-yellow text-yellow" /> {me.rating}
              <span>· {vehicleLabel[me.vehicle]}</span>
            </p>
          </div>
        </div>

        <dl className="relative mt-4 grid grid-cols-3 gap-2">
          <Stat label="En curso" value={String(active.length)} tone="orange" />
          <Stat label="Entregados" value={String(done.length)} tone="acid" />
          <Stat
            label="Recaudado"
            value={money(done.reduce((total, order) => total + order.total, 0))}
          />
        </dl>
      </header>

      {/* ------------------------------ EN CURSO ------------------------------ */}
      <section className="mt-6">
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl text-bone">
          <Navigation className="size-4 text-orange" /> EN CURSO
          {active.length > 0 && (
            <span className="rounded-full bg-orange/20 px-2.5 py-0.5 text-xs text-orange">
              {active.length}
            </span>
          )}
        </h2>

        {active.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-4 py-8 text-center text-sm text-concrete">
            No tienes entregas activas.
          </p>
        ) : (
          <ul className="space-y-3">
            {active.map((order) => {
              const started = order.status === 'on_the_way'
              const cash = order.paymentMethodId === 'cash'
              return (
                <li
                  key={order.id}
                  className="overflow-hidden rounded-3xl border border-white/[0.08] bg-carbon"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{ORDER_STATUS_EMOJI[order.status]}</span>
                      <span className="font-display text-base text-bone">{order.code}</span>
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
                        started ? 'bg-cyan/20 text-cyan' : 'bg-orange/20 text-orange',
                      )}
                    >
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                  </div>

                  <div className="space-y-3 p-4">
                    {/* Dirección: lo más importante para el domiciliario */}
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 size-5 shrink-0 text-red" />
                      <div className="min-w-0">
                        <p className="font-display text-lg leading-tight text-bone">
                          {order.address.line}
                        </p>
                        <p className="text-xs text-ash">
                          {order.address.label}
                          {order.address.neighborhood ? ` · ${order.address.neighborhood}` : ''}
                          {order.address.city ? ` · ${order.address.city}` : ''}
                        </p>
                        {order.address.details && (
                          <p className="mt-0.5 text-xs text-concrete">{order.address.details}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-ash">
                      <span className="flex items-center gap-1">
                        <Package className="size-3.5" />
                        {order.items.reduce((total, item) => total + item.quantity, 0)} productos
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" /> {timeAgo(order.createdAt)}
                      </span>
                      {cash && (
                        <span className="flex items-center gap-1 rounded-full bg-acid/15 px-2 py-0.5 font-bold text-acid">
                          <Wallet className="size-3.5" /> Cobrar {money(order.total)}
                        </span>
                      )}
                    </div>

                    {order.notes && (
                      <p className="rounded-xl bg-white/[0.04] px-3 py-2 text-xs text-ash">
                        📝 {order.notes}
                      </p>
                    )}

                    {/* Acciones */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <a
                        href={`tel:${me.phone.replace(/\s/g, '')}`}
                        className="flex h-11 items-center gap-2 rounded-2xl border border-white/12 px-4 font-display text-xs uppercase tracking-wide text-bone transition hover:border-red/50 hover:text-red"
                      >
                        <Phone className="size-4" /> Llamar
                      </a>
                      <Link
                        to={`/tracking/${order.id}`}
                        className="flex h-11 items-center gap-2 rounded-2xl border border-white/12 px-4 font-display text-xs uppercase tracking-wide text-bone transition hover:border-red/50 hover:text-red"
                      >
                        <MapPin className="size-4" /> Seguimiento
                      </Link>

                      {!started ? (
                        <button
                          type="button"
                          onClick={() => startTrip(order)}
                          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-red px-4 font-display text-xs uppercase tracking-wide text-white shadow-primary transition active:scale-95"
                        >
                          <Bike className="size-4" /> Iniciar viaje
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => deliver(order)}
                          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-acid px-4 font-display text-xs uppercase tracking-wide text-ink transition active:scale-95"
                        >
                          <CheckCircle2 className="size-4" /> Marcar entregado
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* ---------------------------- DISPONIBLES ---------------------------- */}
      {available.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 font-display text-xl text-bone">
            <Hand className="size-4 text-yellow" /> DISPONIBLES
            <span className="rounded-full bg-yellow/20 px-2.5 py-0.5 text-xs text-yellow">
              {available.length}
            </span>
          </h2>
          <ul className="space-y-2">
            {available.map((order) => (
              <li
                key={order.id}
                className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-carbon p-3.5"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-base">
                  {ORDER_STATUS_EMOJI[order.status]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-bone">{order.code}</span>
                  <span className="block truncate text-xs text-ash">{order.address.line}</span>
                </span>
                <button
                  type="button"
                  onClick={() => take(order)}
                  className="shrink-0 rounded-xl border border-red/50 px-3 py-2 font-display text-[11px] uppercase tracking-wide text-red transition hover:bg-red hover:text-white"
                >
                  Tomar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ----------------------------- ENTREGADOS ----------------------------- */}
      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl text-bone">
          <BadgeCheck className="size-4 text-acid" /> ENTREGADOS
        </h2>
        {done.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-4 py-6 text-center text-sm text-concrete">
            Todavía no has entregado pedidos.
          </p>
        ) : (
          <ul className="space-y-2">
            {done.map((order) => (
              <li
                key={order.id}
                className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-carbon/60 p-3.5"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-acid/12 text-base">
                  ✅
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-bone">{order.code}</span>
                  <span className="block truncate text-xs text-ash">{order.address.line}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-display text-sm text-bone">{money(order.total)}</span>
                  <span className="block text-[10px] text-concrete">
                    {timeAgo(order.updatedAt)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-8 text-center text-[11px] text-concrete">
        Seguimiento GPS en tiempo real: próximamente.
      </p>
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'orange' | 'acid'
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-concrete">{label}</dt>
      <dd
        className={cn(
          'mt-0.5 font-display text-lg',
          tone === 'orange' ? 'text-orange' : tone === 'acid' ? 'text-acid' : 'text-bone',
        )}
      >
        {value}
      </dd>
    </div>
  )
}
