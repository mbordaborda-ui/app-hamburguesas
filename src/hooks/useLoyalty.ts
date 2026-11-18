import { useMemo } from 'react'
import { emptyAccount, levelProgress } from '@/lib/loyalty'
import { GUEST_ID, useAuth } from '@/store/auth'
import { useDb } from '@/store/db'

export function useLoyalty() {
  const user = useAuth((s) => s.user)
  const accounts = useDb((s) => s.accounts)
  const userId = user?.id ?? GUEST_ID

  return useMemo(() => {
    const account = accounts[userId] ?? emptyAccount(userId)
    const progress = levelProgress(account)
    return { account, ...progress, isGuest: !user }
  }, [accounts, userId, user])
}

export function useFavorites() {
  const user = useAuth((s) => s.user)
  const favorites = useDb((s) => s.favorites)
  const toggleFavorite = useDb((s) => s.toggleFavorite)
  const userId = user?.id ?? GUEST_ID
  const ids = favorites[userId] ?? []

  return {
    ids,
    has: (productId: string) => ids.includes(productId),
    toggle: (productId: string) => toggleFavorite(userId, productId),
  }
}
