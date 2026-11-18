import { useMemo } from 'react'
import { topProduct, usualOrder } from '@/lib/habits'
import { useAuth } from '@/store/auth'
import { useDb } from '@/store/db'

/**
 * Hábitos del cliente a partir de su historial: combo habitual y producto
 * estrella. Solo lee el store.
 */
export function useOrderHabits() {
  const user = useAuth((s) => s.user)
  const orders = useDb((s) => s.orders)

  return useMemo(() => {
    const mine = user ? orders.filter((order) => order.userId === user.id) : []
    return {
      orders: mine,
      count: mine.length,
      usual: usualOrder(mine),
      topProduct: topProduct(mine),
      firstName: user?.name?.split(' ')[0] ?? '',
    }
  }, [orders, user])
}
