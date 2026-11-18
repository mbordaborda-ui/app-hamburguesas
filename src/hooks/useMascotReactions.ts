import { useEffect, useRef } from 'react'
import type { MascotMessageKey } from '@/data/mascot'
import { cartCount } from '@/lib/pricing'
import { useCart } from '@/store/cart'
import { useDb } from '@/store/db'
import { useMascot } from '@/store/mascot'
import type { OrderStatus } from '@/types'

const IDLE_MS = 45000
const FRESH_ORDER_MS = 60000

/**
 * Hace que la mascota reaccione a lo que el usuario ya está haciendo.
 *
 * Es 100% de solo lectura: observa el carrito y los pedidos, nunca los toca.
 * No modifica ni una línea de la lógica de carrito, checkout, pagos ni pedidos.
 */
export function useMascotReactions() {
  const lines = useCart((s) => s.lines)
  const orders = useDb((s) => s.orders)
  const say = useMascot((s) => s.say)

  /* ----------------------------- Carrito ----------------------------- */
  const prevCount = useRef<number | null>(null)
  const prevQty = useRef<number>(0)

  useEffect(() => {
    const count = cartCount(lines)
    const qty = lines.reduce((total, line) => total + line.quantity, 0)

    if (prevCount.current === null) {
      prevCount.current = count
      prevQty.current = qty
      return
    }

    if (count > prevCount.current) {
      const added = qty - prevQty.current
      say(added >= 2 ? 'addMany' : 'add')
    } else if (count < prevCount.current) {
      say(count === 0 ? 'empty' : 'remove')
    }

    prevCount.current = count
    prevQty.current = qty
  }, [lines, say])

  /* ------------------------------ Pedidos ---------------------------- */
  const lastOrder = orders[0]
  const prevStatus = useRef<OrderStatus | null>(null)

  useEffect(() => {
    if (!lastOrder) return

    const statusMessage: Partial<Record<OrderStatus, MascotMessageKey>> = {
      confirmed: 'orderConfirmed',
      preparing: 'orderPreparing',
      on_the_way: 'orderOnTheWay',
      delivered: 'orderDelivered',
    }
    const key = statusMessage[lastOrder.status]

    if (prevStatus.current === null) {
      // Solo anunciamos el primer estado si el pedido acaba de crearse,
      // para no repetir el mensaje cada vez que se abre la app.
      const isFresh = Date.now() - new Date(lastOrder.createdAt).getTime() < FRESH_ORDER_MS
      if (isFresh && key) say(key)
    } else if (prevStatus.current !== lastOrder.status && key) {
      say(key)
    }

    prevStatus.current = lastOrder.status
  }, [lastOrder, say])

  /* --------------------------- Inactividad --------------------------- */
  useEffect(() => {
    let timer = 0
    let fired = false

    const schedule = () => {
      fired = false
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        if (fired || document.hidden) return
        fired = true
        say('idle')
      }, IDLE_MS)
    }

    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'scroll', 'touchstart']
    events.forEach((event) => window.addEventListener(event, schedule, { passive: true }))
    schedule()

    return () => {
      window.clearTimeout(timer)
      events.forEach((event) => window.removeEventListener(event, schedule))
    }
  }, [say])
}
