import { useMemo, useState } from 'react'
import {
  Check,
  CheckCircle2,
  ChefHat,
  Clock,
  Flame,
  MapPin,
  Package,
  Play,
} from 'lucide-react'
import { ORDER_STATUS_EMOJI, ORDER_STATUS_LABEL } from '@/services/api'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/auth'
import { useDb } from '@/store/db'
import { toast } from '@/store/ui'
import type { Order, OrderItem, OrderStatus, Product } from '@/types'

/* ------------------------------------------------------------------ */
/* Configuración                                                       */
/* ------------------------------------------------------------------ */

type Tab = 'queue' | 'preparing' | 'ready'

const TABS: { id: Tab; label: string; emoji: string; statuses: OrderStatus[] }[] = [
  { id: 'queue', label: 'Por preparar', emoji: '🧾', statuses: ['received', 'confirmed'] },
  { id: 'preparing', label: 'En preparación', emoji: '🔥', statuses: ['preparing'] },
  { id: 'ready', label: 'Listos', emoji: '✅', statuses: ['ready'] },
]

/** Categorías que no van a la parrilla: se empacan al final (bebidas/acompañamientos). */
const PACK_CATEGORIES = new Set(['cat_drinks', 'cat_sides'])

/* ------------------------------------------------------------------ */
/* Ticket                                                              */
/* ------------------------------------------------------------------ */

function Ticket({
  order,
  products,
  onStart,
  onReady,
  onTogglePrepared,
  onTogglePacked,
  onConfirmReady,
}: {
  order: Order
  products: Product[]
  onStart: (order: Order) => void
  onReady: (order: Order) => void
  onTogglePrepared: (orderId: string, itemId: string) => void
  onTogglePacked: (orderId: string, itemId: string) => void
  onConfirmReady: (order: Order) => void
}) {
  const isExtra = (item: OrderItem) => {
    const product = products.find((p) => p.id === item.productId)
    return product ? PACK_CATEGORIES.has(product.categoryId) : false
  }

  const cooked = order.items.filter((item) => !isExtra(item))
  const extras = order.items.filter((item) => isExtra(item))
  const prepared = order.preparedItems ?? []
  const packed = order.packedItems ?? []
  const allPrepared = cooked.length === 0 || cooked.every((item) => prepared.includes(item.id))
  const allPacked = extras.length === 0 || extras.every((item) => packed.includes(item.id))
  const preparedCount = cooked.filter((item) => prepared.includes(item.id)).length
  const units = order.items.reduce((acc, item) => acc + item.quantity, 0)

  const renderItem = (item: OrderItem) => {
    const isPrepared = prepared.includes(item.id)
    const product = products.find((p) => p.id === item.productId)
    const baseIngredients = product?.ingredients ?? []
    const comboContents = product?.comboContents ?? []
    const isCustom = !product
    return (
      <li
        key={item.id}
        className={cn(
          'rounded-2xl border p-3 transition',
          isPrepared ? 'border-acid/40 bg-acid/[0.06]' : 'border-white/[0.08] bg-white/[0.02]',
        )}
      >
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-red font-display text-sm text-white">
            {item.quantity}×
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-base uppercase leading-tight text-bone">{item.name}</p>

            {/* Receta del producto: todos los ingredientes que lleva */}
            {baseIngredients.length > 0 && (
              <div className="mt-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-concrete">
                  Ingredientes
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {baseIngredients.map((ingredient) => (
                    <span
                      key={ingredient}
                      className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-ash"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Combo: qué incluye */}
            {comboContents.length > 0 && (
              <div className="mt-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-concrete">
                  Incluye
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {comboContents.map((content) => (
                    <span
                      key={content}
                      className="rounded-full bg-orange/10 px-2 py-0.5 text-[11px] font-semibold text-orange"
                    >
                      {content}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Personalización del cliente (o ingredientes, si es una burger armada) */}
            {item.selections.length > 0 && (
              <div className="mt-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-concrete">
                  {isCustom ? 'Ingredientes' : 'Personalización'}
                </p>
                <ul className="mt-1 space-y-0.5">
                  {item.selections.map((selection) => (
                    <li key={selection.optionId} className="text-xs leading-relaxed text-ash">
                      <span className="font-bold text-orange">{selection.groupName}:</span>{' '}
                      {selection.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {item.notes && (
              <p className="mt-1.5 inline-flex rounded-lg border border-flame/40 bg-flame/10 px-2 py-1 text-xs font-bold text-flame">
                ⚠️ {item.notes}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onTogglePrepared(order.id, item.id)}
          aria-pressed={isPrepared}
          className={cn(
            'mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border py-2 text-xs font-bold uppercase tracking-wide transition active:scale-[0.98]',
            isPrepared
              ? 'border-acid/60 bg-acid/15 text-acid'
              : 'border-white/15 text-ash hover:border-orange/50 hover:text-bone',
          )}
        >
          {isPrepared ? (
            <>
              <Check className="size-4" strokeWidth={3} /> Preparado
            </>
          ) : (
            <>
              <ChefHat className="size-4" /> Marcar preparado
            </>
          )}
        </button>
      </li>
    )
  }

  return (
    <article className="overflow-hidden rounded-[28px] border border-orange/25 bg-carbon">
      {/* Cabecera */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] bg-orange/[0.06] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-2xl bg-orange/20 text-orange">
            <ChefHat className="size-5" />
          </span>
          <div>
            <p className="font-display text-lg leading-none text-bone">{order.code}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ash">
              <Clock className="size-3" /> {timeAgo(order.createdAt)} · {order.etaMinutes} min ·{' '}
              {units} {units === 1 ? 'ítem' : 'ítems'}
            </p>
          </div>
        </div>
        <span className="rounded-full border border-orange/40 bg-orange/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-orange">
          {ORDER_STATUS_EMOJI[order.status]} {ORDER_STATUS_LABEL[order.status]}
        </span>
      </header>

      <div className="space-y-4 p-4">
        {/* Dirección / cliente */}
        <div className="flex items-start gap-2 text-xs text-ash">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-red" />
          <span className="min-w-0">
            <span className="font-bold text-bone">{order.address.label}</span> · {order.address.line}
            {order.address.details && <span className="text-concrete"> · {order.address.details}</span>}
          </span>
        </div>

        {/* Para preparar */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-orange">
              <Flame className="size-3.5" /> Para preparar
            </p>
            {cooked.length > 0 && (
              <span className={cn('text-[11px] font-bold', allPrepared ? 'text-acid' : 'text-ash')}>
                {preparedCount}/{cooked.length} preparados
              </span>
            )}
          </div>
          <ul className="space-y-2">{cooked.map(renderItem)}</ul>
        </div>

        {/* Adicionales: bebidas / acompañamientos que van en la bolsa */}
        {extras.length > 0 && (
          <div className="rounded-2xl border border-orange/25 bg-orange/[0.06] p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-orange">
              <Package className="size-3.5" /> Adicionales · van en la bolsa
            </p>
            <ul className="mt-2 space-y-1.5">
              {extras.map((item) => {
                const isPacked = packed.includes(item.id)
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onTogglePacked(order.id, item.id)}
                      aria-pressed={isPacked}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition',
                        isPacked
                          ? 'border-acid/50 bg-acid/10 text-bone'
                          : 'border-white/10 bg-white/[0.02] text-ash hover:border-orange/40',
                      )}
                    >
                      <span
                        className={cn(
                          'grid size-5 shrink-0 place-items-center rounded-md border',
                          isPacked ? 'border-acid bg-acid text-ink' : 'border-white/25',
                        )}
                      >
                        {isPacked && <Check className="size-3" strokeWidth={3.5} />}
                      </span>
                      <span className="font-bold text-bone">{item.quantity}×</span>
                      {item.name}
                    </button>
                  </li>
                )
              })}
            </ul>
            {!allPacked && (
              <p className="mt-2 text-[11px] text-flame">
                Falta empacar {extras.filter((item) => !packed.includes(item.id)).length} adicional(es).
              </p>
            )}
          </div>
        )}

        {/* Observaciones del cliente */}
        {order.notes && (
          <div className="rounded-2xl border border-flame/30 bg-flame/[0.08] p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-flame">
              Observaciones del cliente
            </p>
            <p className="mt-1 text-sm leading-relaxed text-bone">{order.notes}</p>
          </div>
        )}

        {/* Acciones */}
        <div className="flex flex-wrap gap-2 pt-1">
          {TABS[0].statuses.includes(order.status) && (
            <button
              type="button"
              onClick={() => onStart(order)}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-orange font-display text-sm uppercase tracking-wide text-ink shadow-orange transition active:scale-[0.97]"
            >
              <Play className="size-4" /> Empezar a preparar
            </button>
          )}
          {order.status === 'preparing' && (
            <button
              type="button"
              onClick={() => onReady(order)}
              disabled={!allPrepared}
              className={cn(
                'inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl font-display text-sm uppercase tracking-wide transition active:scale-[0.97]',
                allPrepared
                  ? 'bg-acid text-ink'
                  : 'cursor-not-allowed border border-white/10 bg-white/[0.03] text-concrete',
              )}
            >
              <CheckCircle2 className="size-4" />
              {allPrepared
                ? 'Confirmar toda la orden'
                : `Faltan ${cooked.length - preparedCount} ítem(s)`}
            </button>
          )}
          {order.status === 'ready' &&
            (order.readyConfirmedAt ? (
              <p className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-acid/30 bg-acid/[0.08] py-2.5 text-xs font-bold uppercase tracking-wide text-acid">
                <CheckCircle2 className="size-4" /> Confirmado · esperando domiciliario
              </p>
            ) : (
              <button
                type="button"
                onClick={() => onConfirmReady(order)}
                disabled={!allPacked}
                className={cn(
                  'inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl font-display text-sm uppercase tracking-wide transition active:scale-[0.97]',
                  allPacked
                    ? 'bg-acid text-ink'
                    : 'cursor-not-allowed border border-white/10 bg-white/[0.03] text-concrete',
                )}
              >
                <CheckCircle2 className="size-4" />
                {allPacked ? 'Confirmar listo' : 'Empaca los adicionales primero'}
              </button>
            ))}
        </div>
      </div>
    </article>
  )
}

/* ------------------------------------------------------------------ */
/* Pantalla de cocina                                                  */
/* ------------------------------------------------------------------ */

export default function KitchenBoard() {
  const user = useAuth((s) => s.user)
  const orders = useDb((s) => s.orders)
  const products = useDb((s) => s.products)
  const setOrderStatus = useDb((s) => s.setOrderStatus)
  const togglePackedItem = useDb((s) => s.togglePackedItem)
  const togglePreparedItem = useDb((s) => s.togglePreparedItem)
  const confirmOrderReady = useDb((s) => s.confirmOrderReady)
  const pushNotification = useDb((s) => s.pushNotification)
  const [tab, setTab] = useState<Tab>('queue')

  const active = useMemo(
    () => orders.filter((o) => o.status !== 'cancelled' && o.status !== 'delivered'),
    [orders],
  )

  const counts: Record<Tab, number> = {
    queue: active.filter((o) => TABS[0].statuses.includes(o.status)).length,
    preparing: active.filter((o) => o.status === 'preparing').length,
    ready: active.filter((o) => o.status === 'ready').length,
  }

  const current = TABS.find((item) => item.id === tab)!
  const list = active
    .filter((o) => current.statuses.includes(o.status))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  const start = (order: Order) => {
    setOrderStatus(order.id, 'preparing')
    setTab('preparing')
    pushNotification({
      type: 'order',
      title: `Pedido ${order.code} en preparación`,
      body: 'La cocina ya está en marcha. 🔥',
      emoji: '👨‍🍳',
      actionUrl: `/tracking/${order.id}`,
    })
    toast({ title: 'En preparación', description: order.code, emoji: '👨‍🍳', tone: 'success' })
  }

  const markReady = (order: Order) => {
    setOrderStatus(order.id, 'ready')
    setTab('ready')
    pushNotification({
      type: 'order',
      title: `Pedido ${order.code} listo`,
      body: 'Empacado y saliendo para tu casa. 🛵',
      emoji: '✅',
      actionUrl: `/tracking/${order.id}`,
    })
    toast({ title: 'Pedido listo', description: order.code, emoji: '✅', tone: 'success' })
  }

  const confirmReady = (order: Order) => {
    confirmOrderReady(order.id)
    pushNotification({
      type: 'order',
      title: `Pedido ${order.code} listo para despacho`,
      body: 'Empacado y esperando domiciliario. 🛵',
      emoji: '📦',
      actionUrl: `/tracking/${order.id}`,
    })
    toast({
      title: 'Pedido confirmado',
      description: `${order.code} listo para despacho`,
      emoji: '✅',
      tone: 'success',
    })
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6">
      {/* ------------------------------ CABECERA ------------------------------ */}
      <header className="relative overflow-hidden rounded-[28px] border border-orange/30 bg-gradient-to-br from-orange/[0.14] via-carbon to-carbon p-5">
        <div className="texture-hatch absolute inset-0 opacity-25" />
        <div className="relative flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-orange/40 bg-orange/15 text-orange">
            <ChefHat className="size-7" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[11px] uppercase tracking-[0.2em] text-orange">
              Pantalla de preparación
            </p>
            <h1 className="mt-0.5 font-display text-2xl text-bone sm:text-3xl">COCINA</h1>
            <p className="mt-0.5 text-xs text-ash">
              {user?.name ?? 'Cocina'} · {active.length} pedidos activos
            </p>
          </div>
        </div>

        <dl className="relative mt-4 grid grid-cols-3 gap-2">
          <Stat label="Por preparar" value={counts.queue} tone="text-orange" />
          <Stat label="En preparación" value={counts.preparing} tone="text-yellow" />
          <Stat label="Listos" value={counts.ready} tone="text-acid" />
        </dl>
      </header>

      {/* -------------------------------- TABS -------------------------------- */}
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-2xl border px-3.5 py-2 font-display text-xs uppercase tracking-wide transition',
              tab === item.id
                ? 'border-orange bg-orange text-ink shadow-orange'
                : 'border-white/10 bg-white/[0.03] text-ash hover:border-orange/50 hover:text-bone',
            )}
          >
            <span aria-hidden>{item.emoji}</span>
            {item.label}
            <span
              className={cn(
                'grid size-5 place-items-center rounded-full text-[10px]',
                tab === item.id ? 'bg-ink/20 text-ink' : 'bg-white/10 text-ash',
              )}
            >
              {counts[item.id]}
            </span>
          </button>
        ))}
      </div>

      {/* ------------------------------- TICKETS ------------------------------ */}
      <div className="mt-4 space-y-4">
        {list.length === 0 ? (
          <div className="rounded-[28px] border border-white/[0.08] bg-carbon py-14 text-center">
            <p className="text-4xl">{tab === 'ready' ? '✅' : '🧾'}</p>
            <p className="mt-3 font-display text-lg text-bone">
              {tab === 'queue'
                ? 'No hay pedidos por preparar'
                : tab === 'preparing'
                  ? 'Nada en la parrilla ahora mismo'
                  : 'Sin pedidos listos'}
            </p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-ash">
              Los pedidos nuevos aparecen aquí automáticamente.
            </p>
          </div>
        ) : (
          list.map((order) => (
            <Ticket
              key={order.id}
              order={order}
              products={products}
              onStart={start}
              onReady={markReady}
              onTogglePrepared={togglePreparedItem}
              onTogglePacked={togglePackedItem}
              onConfirmReady={confirmReady}
            />
          ))
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-center">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-concrete">{label}</dt>
      <dd className={cn('mt-0.5 font-display text-xl', tone)}>{value}</dd>
    </div>
  )
}
