import { loyaltyLevels } from '@/data/rewards'
import type { LoyaltyAccount, LoyaltyLevel, LoyaltyLevelId } from '@/types'

export const levelForPoints = (points: number): LoyaltyLevel => {
  let current = loyaltyLevels[0]
  for (const level of loyaltyLevels) {
    if (points >= level.minPoints) current = level
  }
  return current
}

export const levelById = (id: LoyaltyLevelId): LoyaltyLevel =>
  loyaltyLevels.find((l) => l.id === id) ?? loyaltyLevels[0]

export const nextLevel = (id: LoyaltyLevelId): LoyaltyLevel | undefined => {
  const index = loyaltyLevels.findIndex((l) => l.id === id)
  return loyaltyLevels[index + 1]
}

export const levelProgress = (account: LoyaltyAccount) => {
  const current = levelForPoints(account.lifetimePoints)
  const next = nextLevel(current.id)
  if (!next) return { current, next: undefined, percent: 100, remaining: 0 }
  const span = next.minPoints - current.minPoints
  const done = account.lifetimePoints - current.minPoints
  return {
    current,
    next,
    percent: Math.min(100, Math.round((done / span) * 100)),
    remaining: Math.max(0, next.minPoints - account.lifetimePoints),
  }
}

export const pointsFromSpend = (amount: number, multiplier = 1, perCurrency = 1000) =>
  Math.floor((amount / perCurrency) * multiplier)

export const emptyAccount = (userId: string): LoyaltyAccount => ({
  userId,
  points: 0,
  lifetimePoints: 0,
  level: 'rookie',
  streak: 0,
  totalOrders: 0,
  totalSpent: 0,
})
