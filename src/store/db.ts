import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { safeStorage } from '@/lib/safeStorage'
import { categories as seedCategories, products as seedProducts } from '@/data/catalog'
import { notifications as seedNotifications, reviews as seedReviews, coupons as seedCoupons, drops as seedDrops } from '@/data/marketing'
import { badges as seedBadges, missions as seedMissions, rewards as seedRewards } from '@/data/rewards'
import { drivers as seedDrivers } from '@/data/drivers'
import { settings as seedSettings, defaultHours } from '@/data/settings'
import { emptyAccount, levelForPoints, pointsFromSpend } from '@/lib/loyalty'
import { uid } from '@/lib/utils'
import type {
  Address,
  AppNotification,
  Badge,
  Category,
  Coupon,
  Driver,
  Drop,
  ID,
  Invoice,
  LoyaltyAccount,
  Mission,
  Order,
  OrderStatus,
  Payment,
  PaymentStatus,
  Product,
  Review,
  Reward,
  Settings,
  User,
} from '@/types'

export interface DbState {
  version: number
  products: Product[]
  categories: Category[]
  orders: Order[]
  payments: Payment[]
  invoices: Invoice[]
  coupons: Coupon[]
  drops: Drop[]
  reviews: Review[]
  notifications: AppNotification[]
  missions: Mission[]
  rewards: Reward[]
  badges: Badge[]
  users: User[]
  drivers: Driver[]
  accounts: Record<ID, LoyaltyAccount>
  favorites: Record<ID, ID[]>
  addresses: Address[]
  settings: Settings

  /* productos */
  upsertProduct: (product: Product) => void
  deleteProduct: (id: ID) => void
  toggleProductAvailability: (id: ID) => void

  /* categorías */
  upsertCategory: (category: Category) => void
  deleteCategory: (id: ID) => void

  /* pedidos */
  addOrder: (order: Order) => void
  patchOrder: (id: ID, patch: Partial<Order>) => void
  setOrderStatus: (id: ID, status: OrderStatus) => void
  markOrderReviewed: (id: ID) => void
  togglePackedItem: (orderId: ID, itemId: ID) => void
  togglePreparedItem: (orderId: ID, itemId: ID) => void
  confirmOrderReady: (orderId: ID) => void

  /* pagos */
  addPayment: (payment: Payment) => void
  setPaymentStatus: (id: ID, status: PaymentStatus, reason?: string) => void

  /* facturas */
  addInvoice: (invoice: Invoice) => void
  patchInvoice: (id: ID, patch: Partial<Invoice>) => void

  /* cupones */
  upsertCoupon: (coupon: Coupon) => void
  deleteCoupon: (id: ID) => void
  registerCouponUse: (code: string) => void

  /* drops */
  upsertDrop: (drop: Drop) => void
  takeDropUnit: (id: ID) => void

  /* reseñas */
  addReview: (review: Review) => void
  likeReview: (id: ID) => void

  /* notificaciones */
  pushNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void
  markNotificationRead: (id: ID) => void
  markAllNotificationsRead: () => void
  clearNotifications: () => void

  /* fidelización */
  setMissionProgress: (id: ID, progress: number) => void
  claimMission: (id: ID) => void
  addMission: (mission: Mission) => void
  upsertReward: (reward: Reward) => void
  deleteReward: (id: ID) => void
  ensureAccount: (userId: ID) => LoyaltyAccount
  addPoints: (userId: ID, points: number) => void
  spendPoints: (userId: ID, points: number) => void
  registerOrderStats: (userId: ID, total: number) => void
  unlockBadge: (id: ID) => void

  /* usuarios y perfil */
  upsertUser: (user: User) => void
  deleteUser: (id: ID) => void
  upsertDriver: (driver: Driver) => void
  deleteDriver: (id: ID) => void
  assignCourier: (orderId: ID, driverId: ID | null) => void
  toggleFavorite: (userId: ID, productId: ID) => void
  upsertAddress: (userId: ID, address: Address) => void
  removeAddress: (userId: ID, addressId: ID) => void
  setDefaultAddress: (userId: ID, addressId: ID) => void

  /* config */
  updateSettings: (patch: Partial<Settings>) => void
  updatePaymentMethod: (id: string, patch: Partial<Settings['paymentMethods'][number]>) => void
  resetDemoData: () => void
}

const seedState = () => ({
  version: 2,
  products: seedProducts,
  categories: seedCategories,
  orders: [] as Order[],
  payments: [] as Payment[],
  invoices: [] as Invoice[],
  coupons: seedCoupons,
  drops: seedDrops,
  reviews: seedReviews,
  notifications: seedNotifications,
  missions: seedMissions,
  rewards: seedRewards,
  badges: seedBadges,
  users: [] as User[],
  drivers: seedDrivers,
  accounts: {} as Record<ID, LoyaltyAccount>,
  favorites: {} as Record<ID, ID[]>,
  addresses: [] as Address[],
  settings: seedSettings,
})

export const useDb = create<DbState>()(
  persist(
    (set, get) => ({
      ...seedState(),

      upsertProduct: (product) =>
        set((s) => {
          const exists = s.products.some((p) => p.id === product.id)
          return {
            products: exists
              ? s.products.map((p) => (p.id === product.id ? product : p))
              : [product, ...s.products],
          }
        }),
      deleteProduct: (id) => set((s) => ({ products: s.products.filter((p) => p.id !== id) })),
      toggleProductAvailability: (id) =>
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id ? { ...p, isAvailable: !p.isAvailable } : p,
          ),
        })),

      upsertCategory: (category) =>
        set((s) => {
          const exists = s.categories.some((c) => c.id === category.id)
          return {
            categories: exists
              ? s.categories.map((c) => (c.id === category.id ? category : c))
              : [...s.categories, category],
          }
        }),
      deleteCategory: (id) =>
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),

      addOrder: (order) => set((s) => ({ orders: [order, ...s.orders] })),
      patchOrder: (id, patch) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id ? { ...o, ...patch, updatedAt: new Date().toISOString() } : o,
          ),
        })),
      setOrderStatus: (id, status) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status,
                  updatedAt: new Date().toISOString(),
                  statusHistory: [...o.statusHistory, { status, at: new Date().toISOString() }],
                }
              : o,
          ),
        })),
      markOrderReviewed: (id) =>
        set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, reviewed: true } : o)) })),
      togglePackedItem: (orderId, itemId) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== orderId) return o
            const packed = o.packedItems ?? []
            return {
              ...o,
              packedItems: packed.includes(itemId)
                ? packed.filter((id) => id !== itemId)
                : [...packed, itemId],
            }
          }),
        })),
      confirmOrderReady: (orderId) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId ? { ...o, readyConfirmedAt: new Date().toISOString() } : o,
          ),
        })),
      togglePreparedItem: (orderId, itemId) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== orderId) return o
            const prepared = o.preparedItems ?? []
            return {
              ...o,
              preparedItems: prepared.includes(itemId)
                ? prepared.filter((id) => id !== itemId)
                : [...prepared, itemId],
            }
          }),
        })),

      addPayment: (payment) => set((s) => ({ payments: [payment, ...s.payments] })),
      setPaymentStatus: (id, status, reason) =>
        set((s) => ({
          payments: s.payments.map((p) =>
            p.id === id
              ? { ...p, status, failureReason: reason, updatedAt: new Date().toISOString() }
              : p,
          ),
        })),

      addInvoice: (invoice) => set((s) => ({ invoices: [invoice, ...s.invoices] })),
      patchInvoice: (id, patch) =>
        set((s) => ({
          invoices: s.invoices.map((invoice) =>
            invoice.id === id ? { ...invoice, ...patch } : invoice,
          ),
        })),

      upsertCoupon: (coupon) =>
        set((s) => {
          const exists = s.coupons.some((c) => c.id === coupon.id)
          return {
            coupons: exists
              ? s.coupons.map((c) => (c.id === coupon.id ? coupon : c))
              : [coupon, ...s.coupons],
          }
        }),
      deleteCoupon: (id) => set((s) => ({ coupons: s.coupons.filter((c) => c.id !== id) })),
      registerCouponUse: (code) =>
        set((s) => ({
          coupons: s.coupons.map((c) =>
            c.code === code ? { ...c, usedCount: c.usedCount + 1 } : c,
          ),
        })),

      upsertDrop: (drop) =>
        set((s) => {
          const exists = s.drops.some((d) => d.id === drop.id)
          return {
            drops: exists ? s.drops.map((d) => (d.id === drop.id ? drop : d)) : [drop, ...s.drops],
          }
        }),
      takeDropUnit: (id) =>
        set((s) => ({
          drops: s.drops.map((d) =>
            d.id === id ? { ...d, remaining: Math.max(0, d.remaining - 1) } : d,
          ),
        })),

      addReview: (review) => set((s) => ({ reviews: [review, ...s.reviews] })),
      likeReview: (id) =>
        set((s) => ({
          reviews: s.reviews.map((r) => (r.id === id ? { ...r, likes: r.likes + 1 } : r)),
        })),

      pushNotification: (n) =>
        set((s) => ({
          notifications: [
            { ...n, id: uid('n'), createdAt: new Date().toISOString(), read: false },
            ...s.notifications,
          ].slice(0, 60),
        })),
      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      markAllNotificationsRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      clearNotifications: () => set({ notifications: [] }),

      setMissionProgress: (id, progress) =>
        set((s) => ({ missions: s.missions.map((m) => (m.id === id ? { ...m, progress } : m)) })),
      claimMission: (id) =>
        set((s) => ({ missions: s.missions.map((m) => (m.id === id ? { ...m, claimed: true } : m)) })),
      addMission: (mission) => set((s) => ({ missions: [mission, ...s.missions] })),
      upsertReward: (reward) =>
        set((s) => {
          const exists = s.rewards.some((r) => r.id === reward.id)
          return {
            rewards: exists
              ? s.rewards.map((r) => (r.id === reward.id ? reward : r))
              : [reward, ...s.rewards],
          }
        }),
      deleteReward: (id) => set((s) => ({ rewards: s.rewards.filter((r) => r.id !== id) })),

      ensureAccount: (userId) => {
        const existing = get().accounts[userId]
        if (existing) return existing
        const account = emptyAccount(userId)
        set((s) => ({ accounts: { ...s.accounts, [userId]: account } }))
        return account
      },
      addPoints: (userId, points) =>
        set((s) => {
          const account = s.accounts[userId] ?? emptyAccount(userId)
          const lifetime = account.lifetimePoints + points
          return {
            accounts: {
              ...s.accounts,
              [userId]: {
                ...account,
                points: account.points + points,
                lifetimePoints: lifetime,
                level: levelForPoints(lifetime).id,
              },
            },
          }
        }),
      spendPoints: (userId, points) =>
        set((s) => {
          const account = s.accounts[userId]
          if (!account) return {}
          return {
            accounts: { ...s.accounts, [userId]: { ...account, points: Math.max(0, account.points - points) } },
          }
        }),
      registerOrderStats: (userId, total) =>
        set((s) => {
          const account = s.accounts[userId] ?? emptyAccount(userId)
          const perCurrency = s.settings.pointsPerCurrency
          const multiplier = levelForPoints(account.lifetimePoints).multiplier
          const earned = pointsFromSpend(total, multiplier, perCurrency)
          const lifetime = account.lifetimePoints + earned
          return {
            accounts: {
              ...s.accounts,
              [userId]: {
                ...account,
                points: account.points + earned,
                lifetimePoints: lifetime,
                level: levelForPoints(lifetime).id,
                totalOrders: account.totalOrders + 1,
                totalSpent: account.totalSpent + total,
                streak: account.streak + 1,
                lastOrderAt: new Date().toISOString(),
              },
            },
          }
        }),
      unlockBadge: (id) =>
        set((s) => ({
          badges: s.badges.map((b) =>
            b.id === id && !b.unlockedAt ? { ...b, unlockedAt: new Date().toISOString() } : b,
          ),
        })),

      upsertUser: (user) =>
        set((s) => {
          const exists = s.users.some((u) => u.id === user.id)
          return {
            users: exists ? s.users.map((u) => (u.id === user.id ? user : u)) : [...s.users, user],
          }
        }),
      deleteUser: (id) => set((s) => ({ users: s.users.filter((u) => u.id !== id) })),

      upsertDriver: (driver) =>
        set((s) => {
          const exists = s.drivers.some((d) => d.id === driver.id)
          return {
            drivers: exists
              ? s.drivers.map((d) => (d.id === driver.id ? driver : d))
              : [...s.drivers, driver],
          }
        }),
      deleteDriver: (id) => set((s) => ({ drivers: s.drivers.filter((d) => d.id !== id) })),

      // Asigna (o quita) un domiciliario y guarda la copia en el pedido.
      assignCourier: (orderId, driverId) =>
        set((s) => {
          const driver = driverId ? s.drivers.find((d) => d.id === driverId) : undefined
          return {
            orders: s.orders.map((order) =>
              order.id === orderId
                ? {
                    ...order,
                    courierId: driver?.id,
                    courier: driver
                      ? {
                          name: driver.name,
                          phone: driver.phone,
                          rating: driver.rating,
                          vehicle: driver.vehicle,
                          photo: driver.photo,
                        }
                      : undefined,
                    updatedAt: new Date().toISOString(),
                  }
                : order,
            ),
          }
        }),

      toggleFavorite: (userId, productId) =>
        set((s) => {
          const list = s.favorites[userId] ?? []
          const next = list.includes(productId)
            ? list.filter((p) => p !== productId)
            : [productId, ...list]
          return { favorites: { ...s.favorites, [userId]: next } }
        }),
      upsertAddress: (_userId, address) =>
        set((s) => {
          const exists = s.addresses.some((a) => a.id === address.id)
          let addresses = exists
            ? s.addresses.map((a) => (a.id === address.id ? address : a))
            : [...s.addresses, address]
          if (address.isDefault) {
            addresses = addresses.map((a) =>
              a.id === address.id ? a : { ...a, isDefault: false },
            )
          }
          return { addresses }
        }),
      removeAddress: (_userId, addressId) =>
        set((s) => ({ addresses: s.addresses.filter((a) => a.id !== addressId) })),
      setDefaultAddress: (_userId, addressId) =>
        set((s) => ({
          addresses: s.addresses.map((a) => ({ ...a, isDefault: a.id === addressId })),
        })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      updatePaymentMethod: (id, patch) =>
        set((s) => ({
          settings: {
            ...s.settings,
            paymentMethods: s.settings.paymentMethods.map((m) =>
              m.id === id ? { ...m, ...patch } : m,
            ),
          },
        })),
      resetDemoData: () => set({ ...seedState() }),
    }),
    {
      name: 'elparche-db-v1',
      version: 4,
      storage: createJSONStorage(() => safeStorage),
      // Rellena campos que no existían en versiones previas: horario, datos legales e IVA.
      migrate: (persisted) => {
        const state = persisted as Partial<DbState>
        if (state.settings) {
          const settings = state.settings
          const noTaxConfigured = !settings.taxRate && !settings.consumptionTaxRate
          state.settings = {
            ...seedSettings,
            ...settings,
            hours: settings.hours ?? defaultHours,
            // Si nadie configuró impuestos, activamos el IVA incluido por defecto.
            ...(noTaxConfigured ? { taxRate: seedSettings.taxRate } : {}),
          }
        }
        return state as DbState
      },
    },
  ),
)

export const dbSelectors = {
  productById: (id: ID) => (s: DbState) => s.products.find((p) => p.id === id),
  categoryById: (id: ID) => (s: DbState) => s.categories.find((c) => c.id === id),
}
