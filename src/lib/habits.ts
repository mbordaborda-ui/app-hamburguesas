/**
 * Hábitos de compra: dominio puro sobre el historial de pedidos.
 *
 * Sirve para responder "¿qué pide siempre este cliente?" sin tocar la UI:
 * `usualOrder` (el combo más repetido) y `topProduct` (el producto estrella).
 */

import { uid } from '@/lib/utils'
import type { CartLine, Order, OrderItem } from '@/types'

export interface UsualOrder {
  /** Items del pedido más repetido (usa el más reciente como representante). */
  items: OrderItem[]
  /** Firma del combo: productos ordenados alfabéticamente. */
  signature: string
  /** Cuántas veces lo ha pedido. */
  times: number
  /** Fecha ISO del pedido representativo. */
  lastAt: string
  total: number
  orderId: string
}

export interface TopProduct {
  productId: string
  name: string
  quantity: number
}

const signatureOf = (order: Order) =>
  order.items
    .map((item) => item.productId)
    .sort()
    .join('|')

/** El combo que más se repite en el historial (ignora cancelados y vacíos). */
export function usualOrder(orders: Order[]): UsualOrder | null {
  const valid = orders.filter((order) => order.status !== 'cancelled' && order.items.length > 0)
  if (valid.length === 0) return null

  const groups = new Map<string, Order[]>()
  for (const order of valid) {
    const signature = signatureOf(order)
    groups.set(signature, [...(groups.get(signature) ?? []), order])
  }

  let best: Order[] = []
  for (const group of groups.values()) {
    if (
      group.length > best.length ||
      (group.length === best.length && group[0].createdAt > (best[0]?.createdAt ?? ''))
    ) {
      best = group
    }
  }

  const representative = [...best].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  return {
    items: representative.items,
    signature: signatureOf(representative),
    times: best.length,
    lastAt: representative.createdAt,
    total: representative.total,
    orderId: representative.id,
  }
}

/** Producto más pedido por cantidad total. */
export function topProduct(orders: Order[]): TopProduct | null {
  const counts = new Map<string, TopProduct>()
  for (const order of orders) {
    if (order.status === 'cancelled') continue
    for (const item of order.items) {
      const entry = counts.get(item.productId) ?? {
        productId: item.productId,
        name: item.name,
        quantity: 0,
      }
      entry.quantity += item.quantity
      counts.set(item.productId, entry)
    }
  }

  let best: TopProduct | null = null
  for (const entry of counts.values()) {
    if (!best || entry.quantity > best.quantity) best = entry
  }
  return best
}

/** Convierte los items de un pedido en líneas de carrito listas para `loadLines`. */
export function orderToLines(items: OrderItem[]): CartLine[] {
  return items.map((item) => ({
    id: uid('line'),
    productId: item.productId,
    name: item.name,
    image: item.image,
    basePrice: item.unitPrice,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    selections: item.selections,
    notes: item.notes,
  }))
}
