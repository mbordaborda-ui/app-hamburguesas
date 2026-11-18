import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Bike, Clock, FileText, MapPin, Phone, Star } from 'lucide-react'
import {
  BurgerGlyph,
  ScooterGlyph,
  SprayDots,
  Sticker,
  TagArrow,
} from '@/components/brand/StreetArt'
import { Button, LinkButton } from '@/components/ui/Button'
import { EmptyState, ProgressBar } from '@/components/ui/Feedback'
import { SmartImage } from '@/components/ui/SmartImage'
import { ORDER_FLOW, ORDER_STATUS_EMOJI, ORDER_STATUS_LABEL } from '@/services/api'
import { clockLabel, money } from '@/lib/format'
import { cn } from '@/lib/utils'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useAuth } from '@/store/auth'
import { useDb } from '@/store/db'
import { toast } from '@/store/ui'
import type { OrderStatus } from '@/types'

/** Respaldo cuando el pedido todavía no tiene domiciliario asignado. */
const DEFAULT_COURIER = {
  name: 'El equipo del parche',
  phone: '+57 300 000 0000',
  rating: 4.9,
  vehicle: 'moto' as const,
  photo: 'https://i.pravatar.cc/150?img=68',
}

/** Color de identidad por etapa del pedido. */
const STATUS_TONE: Record<OrderStatus, { text: string; bg: string; ring: string; label: string }> = {
  received: { text: 'text-yellow', bg: 'bg-yellow', ring: 'border-yellow/40 bg-yellow/10', label: 'Recibido' },
  confirmed: { text: 'text-red', bg: 'bg-red', ring: 'border-red/40 bg-red/10', label: 'Confirmado' },
  preparing: { text: 'text-orange', bg: 'bg-orange', ring: 'border-orange/40 bg-orange/10', label: 'Preparando' },
  ready: { text: 'text-acid', bg: 'bg-acid', ring: 'border-acid/40 bg-acid/10', label: 'Listo' },
  on_the_way: { text: 'text-yellow', bg: 'bg-yellow', ring: 'border-yellow/40 bg-yellow/10', label: 'En camino' },
  delivered: { text: 'text-acid', bg: 'bg-acid', ring: 'border-acid/40 bg-acid/10', label: 'Entregado' },
  cancelled: { text: 'text-magenta', bg: 'bg-magenta', ring: 'border-magenta/40 bg-magenta/10', label: 'Cancelado' },
}

export default function Tracking() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const order = useDb((s) => s.orders.find((o) => o.id === orderId))
  const setOrderStatus = useDb((s) => s.setOrderStatus)
  const user = useAuth((s) => s.user)
  const { permission, enable } = usePushNotifications()

  // Simulación de progreso (en producción lo empuja el backend por webhook/push)
  useEffect(() => {
    if (!order || order.paymentStatus !== 'approved') return
    if (order.status === 'delivered' || order.status === 'cancelled') return

    const timer = setInterval(() => {
      const current = useDb.getState().orders.find((o) => o.id === order.id)
      if (!current) return
      if (current.status === 'delivered' || current.status === 'cancelled') return
      const last = current.statusHistory[current.statusHistory.length - 1]
      if (Date.now() - new Date(last.at).getTime() < 12000) return
      const index = ORDER_FLOW.indexOf(current.status)
      const next = ORDER_FLOW[Math.min(index + 1, ORDER_FLOW.length - 1)] as OrderStatus
      if (next !== current.status) setOrderStatus(current.id, next)
    }, 4000)

    return () => clearInterval(timer)
  }, [order, setOrderStatus])

  const progress = useMemo(() => {
    if (!order) return 0
    if (order.status === 'cancelled') return 0
    const index = ORDER_FLOW.indexOf(order.status)
    return ((index + 1) / ORDER_FLOW.length) * 100
  }, [order])

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          emoji="🛵"
          title="Pedido no encontrado"
          description="Puede que el enlace haya expirado."
          action={<Button onClick={() => navigate('/menu')}>Volver al menú</Button>}
        />
      </div>
    )
  }

  const currentIndex = ORDER_FLOW.indexOf(order.status)
  const isDone = order.status === 'delivered'
  const showCourier = currentIndex >= ORDER_FLOW.indexOf('ready')
  const courier = order.courier ?? DEFAULT_COURIER
  const tone = STATUS_TONE[order.status]
  const showScooter = order.status === 'on_the_way'

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.16em] text-orange">
            Seguimiento en vivo
          </p>
          <h1 className="mt-0.5 font-display text-3xl text-bone sm:text-4xl">
            Pedido {order.code}
          </h1>
          <p className="mt-1 text-xs text-ash">
            Creado hoy a las {clockLabel(order.createdAt)} · {order.items.length} referencias
          </p>
        </div>
        <Sticker tone={isDone ? 'acid' : 'red'} rotate={-5} size="md">
          <span className="block text-center leading-tight">
            {isDone ? 'Entregado' : 'Llega en'}
            <br />
            <span className="text-[13px]">{isDone ? '🔥' : `${order.etaMinutes} min`}</span>
          </span>
        </Sticker>
      </header>

      {permission === 'default' && !isDone && order.status !== 'cancelled' && (
        <button
          type="button"
          onClick={() => void enable()}
          className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-red/25 bg-red/[0.06] px-4 py-3 text-left transition hover:border-red/50"
        >
          <span className="text-lg">🔔</span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-bold text-bone">Activa las notificaciones</span>
            <span className="block text-[11px] text-ash">
              Te avisamos cuando tu pedido salga para tu casa.
            </span>
          </span>
          <span className="font-display text-[11px] uppercase tracking-wide text-red">Activar</span>
        </button>
      )}

      {/* --------------------------- ESTADO ACTUAL --------------------------- */}
      <section
        className={cn(
          'relative overflow-hidden rounded-[28px] border bg-gradient-to-br from-carbon to-carbon p-5',
          tone.ring,
        )}
      >
        <SprayDots seed={21} className="absolute inset-0 size-full text-white/[0.04]" />

        <div className="relative flex items-center gap-4">
          <span className="relative grid size-20 shrink-0 place-items-center">
            {!isDone && <span className="absolute inset-0 animate-spray-puff rounded-full bg-red/25" />}
            {showScooter ? (
              <ScooterGlyph className="relative size-16" />
            ) : isDone ? (
              <BurgerGlyph className="relative size-16" />
            ) : (
              <span className="relative text-4xl">{ORDER_STATUS_EMOJI[order.status]}</span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className={cn('font-display text-2xl leading-tight sm:text-3xl', tone.text)}>
              {ORDER_STATUS_LABEL[order.status]}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ash">
              {order.status === 'received' && 'Recibimos tu pedido y lo estamos confirmando.'}
              {order.status === 'confirmed' && 'Confirmado. La cocina ya sabe qué preparar.'}
              {order.status === 'preparing' && 'Tu pedido está en la parrilla. 🔥'}
              {order.status === 'ready' && 'Listo y empacado. Saliendo para tu casa.'}
              {order.status === 'on_the_way' && 'El repartidor va en camino.'}
              {order.status === 'delivered' && '¡Buen provecho! Califica tu experiencia.'}
              {order.status === 'cancelled' && 'Este pedido fue cancelado.'}
            </p>
            {isDone && (
              <p className="mt-2">
                <span className="tag-3d tag-fill-fire font-display text-lg sm:text-xl">
                  #ElParcheEstáServido
                </span>
              </p>
            )}
          </div>
        </div>
        <ProgressBar
          value={progress}
          className="relative mt-5 h-2.5"
          showGlow
          tone={order.status === 'cancelled' ? 'flame' : 'yellow'}
        />
      </section>

      {/* ------------------------------- MAPA ------------------------------- */}
      <section className="mt-4 overflow-hidden rounded-[28px] border border-white/[0.08] bg-carbon">
        <div className="texture-grid relative h-44 bg-gradient-to-br from-graphite via-carbon to-ink sm:h-56">
          <div className="absolute inset-0 opacity-60">
            <svg viewBox="0 0 400 200" className="size-full" aria-hidden>
              <path d="M0 60 H400" stroke="#26272C" strokeWidth="10" />
              <path d="M0 140 H400" stroke="#26272C" strokeWidth="10" />
              <path d="M120 0 V200" stroke="#26272C" strokeWidth="10" />
              <path d="M300 0 V200" stroke="#26272C" strokeWidth="10" />
              <path
                d="M120 60 L300 140"
                stroke="#1769FF"
                strokeWidth="4"
                strokeDasharray="9 7"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="absolute left-[28%] top-[26%] flex items-center gap-1.5">
            <span className="grid size-9 place-items-center rounded-full border-2 border-ink bg-yellow text-base shadow-orange">
              🍔
            </span>
          </div>
          <div className="absolute bottom-[24%] right-[22%] flex items-center gap-1.5">
            <span className="grid size-9 place-items-center rounded-full border-2 border-ink bg-magenta text-base text-white">
              📍
            </span>
          </div>
          <span className="absolute bottom-3 left-3 rounded-xl bg-ink/80 px-2.5 py-1 font-display text-[10px] uppercase tracking-wide text-ash backdrop-blur">
            Mapa en tiempo real · próximamente con GPS
          </span>
        </div>

        <div className="flex items-start gap-3 border-t border-white/[0.06] p-4">
          <MapPin className="mt-0.5 size-4 shrink-0 text-red" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-concrete">
              Dirección de entrega
            </p>
            <p className="text-sm text-bone">
              {order.address.label} · {order.address.line}
            </p>
            {order.address.details && <p className="text-xs text-ash">{order.address.details}</p>}
          </div>
        </div>
      </section>

      {/* ---------------------------- REPARTIDOR ---------------------------- */}
      {showCourier && order.status !== 'cancelled' && (
        <section className="mt-4 flex items-center gap-3 rounded-[28px] border border-red/25 bg-carbon p-4">
          <span className="relative shrink-0">
            <img
              src={courier.photo ?? DEFAULT_COURIER.photo}
              alt={courier.name}
              className="size-12 rounded-2xl border-2 border-red/40 object-cover"
              loading="lazy"
            />
            <span className="absolute -bottom-1.5 -right-1.5 grid size-6 place-items-center rounded-full border-2 border-carbon bg-red">
              <Bike className="size-3 text-white" />
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-bone">{courier.name}</p>
            <p className="flex items-center gap-2 text-xs text-ash">
              <Star className="size-3 fill-yellow text-yellow" /> {courier.rating}
              <span className="uppercase tracking-wide">· {courier.vehicle}</span>
            </p>
          </div>
          <a
            href={`tel:${courier.phone.replace(/\s/g, '')}`}
            className="grid size-10 place-items-center rounded-2xl bg-red text-white transition active:scale-90"
            aria-label="Llamar al repartidor"
          >
            <Phone className="size-4" />
          </a>
        </section>
      )}

      {/* --------------------------- LÍNEA DE TIEMPO --------------------------- */}
      <section className="mt-6">
        <h2 className="mb-3 font-display text-xl text-bone">LA RUTA DE TU PEDIDO</h2>
        <ol className="space-y-0">
          {ORDER_FLOW.map((status, index) => {
            const event = order.statusHistory.find((e) => e.status === status)
            const active = index <= currentIndex && order.status !== 'cancelled'
            const statusTone = STATUS_TONE[status]
            return (
              <li key={status} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      'grid size-9 shrink-0 place-items-center rounded-full border-2 text-sm transition',
                      active
                        ? cn(statusTone.bg, 'border-ink text-ink')
                        : 'border-white/15 bg-carbon text-concrete',
                    )}
                  >
                    {ORDER_STATUS_EMOJI[status]}
                  </span>
                  {index < ORDER_FLOW.length - 1 && (
                    <span
                      className={cn(
                        'my-0.5 w-0.5 flex-1 rounded-full',
                        index < currentIndex ? 'bg-red' : 'bg-white/10',
                      )}
                      style={{ minHeight: 28 }}
                    />
                  )}
                </div>
                <div className={cn('pb-5', index === ORDER_FLOW.length - 1 && 'pb-0')}>
                  <p
                    className={cn(
                      'font-display text-base uppercase tracking-wide',
                      active ? 'text-bone' : 'text-concrete',
                    )}
                  >
                    {ORDER_STATUS_LABEL[status]}
                  </p>
                  <p className="flex items-center gap-1 text-[11px] text-concrete">
                    <Clock className="size-3" />
                    {event ? clockLabel(event.at) : 'Pendiente'}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      {/* ---------------------------- TU PEDIDO ---------------------------- */}
      <section className="mt-6 space-y-3">
        <h2 className="font-display text-xl text-bone">TU PEDIDO</h2>
        <div className="divide-y divide-white/[0.06] rounded-3xl border border-white/[0.08] bg-carbon px-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-3">
              <SmartImage
                src={item.image}
                alt={item.name}
                wrapperClassName="size-14 shrink-0 rounded-xl"
                className="size-full"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-bone">
                  {item.quantity}x {item.name}
                </p>
                {item.selections.length > 0 && (
                  <p className="truncate text-[11px] text-ash">
                    {item.selections.map((s) => s.name).join(' · ')}
                  </p>
                )}
              </div>
              <span className="shrink-0 font-display text-base text-bone">
                {money(item.unitPrice * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-1.5 rounded-3xl border border-white/[0.08] bg-carbon p-4 text-sm">
          <Line label="Subtotal" value={money(order.subtotal)} />
          {order.discount > 0 && <Line label="Descuento" value={`- ${money(order.discount)}`} acid />}
          <Line
            label="Domicilio"
            value={order.deliveryFee === 0 ? 'GRATIS' : money(order.deliveryFee)}
            acid={order.deliveryFee === 0}
          />
          {order.tip > 0 && <Line label="Propina" value={money(order.tip)} />}
          <div className="flex items-center justify-between border-t border-dashed border-white/15 pt-2">
            <span className="font-display text-base uppercase text-bone">Total</span>
            <span className="font-display text-2xl text-red">{money(order.total)}</span>
          </div>
          {order.pointsEarned > 0 && (
            <p className="pt-1 text-center text-[11px] font-bold text-red">
              🎁 Ganaste {order.pointsEarned} Street Points
            </p>
          )}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-2">
        {isDone && !order.reviewed && (
          <LinkButton
            to={`/community?order=${order.id}`}
            fullWidth
            size="lg"
            icon={<Star className="size-4" />}
          >
            Calificar mi pedido
          </LinkButton>
        )}
        <Button variant="outline" fullWidth onClick={() => navigate('/orders')}>
          Ver todos mis pedidos
        </Button>
        <LinkButton
          to={`/invoice/${order.id}`}
          variant="outline"
          fullWidth
          icon={<FileText className="size-4" />}
        >
          Ver factura
        </LinkButton>
        <Button
          variant="ghost"
          fullWidth
          onClick={() => {
            void navigator.clipboard?.writeText(order.code)
            toast({ title: 'Código copiado', emoji: '📋' })
          }}
        >
          Copiar número de pedido
        </Button>
      </div>

      <TagArrow className="mx-auto mt-6 h-8 w-20 text-red/40" />

      {!user && (
        <p className="mt-4 text-center text-xs text-concrete">
          <Link to="/register" className="font-bold text-red hover:underline">
            Crea tu cuenta
          </Link>{' '}
          para guardar este pedido y acumular puntos.
        </p>
      )}
    </div>
  )
}

function Line({ label, value, acid }: { label: string; value: string; acid?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ash">{label}</span>
      <span className={cn('font-semibold', acid ? 'text-acid' : 'text-bone')}>{value}</span>
    </div>
  )
}
