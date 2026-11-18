/**
 * ============================================================================
 *  API — fachada única entre la app y los datos
 * ============================================================================
 *
 *  Cada método tiene dos caminos:
 *   - REMOTO : cuando VITE_API_URL está configurado -> backend real.
 *   - LOCAL  : cuando no -> repositorio local persistido (PWA offline / demo).
 *
 *  Las entidades del modelo (users, addresses, products, categories, orders,
 *  order_items, payments, delivery, coupons, loyalty_points, loyalty_levels,
 *  missions, rewards, referrals, reviews, favorites, notifications, drops,
 *  settings) viven en `src/store/db.ts` en modo local y en la base de datos
 *  cuando el backend esté conectado. Ningún componente conoce la diferencia.
 */

import { getPaymentGateway, type CheckoutSession } from '@/services/payments'
import { isRemote, request, tokenStore } from '@/services/http'
import { credentialStore } from '@/lib/safeStorage'
import { computePricing } from '@/lib/pricing'
import { CLOSED_MESSAGE, storeStatus } from '@/lib/hours'
import { buildInvoice } from '@/lib/invoice'
import { emptyAccount, levelForPoints } from '@/lib/loyalty'
import { orderCode, sleep, uid } from '@/lib/utils'
import { useDb } from '@/store/db'
import type {
  Address,
  CartLine,
  Coupon,
  ID,
  Invoice,
  InvoiceStatus,
  Order,
  OrderStatus,
  Payment,
  PaymentMethodId,
  Product,
  Review,
  User,
} from '@/types'

/* ------------------------------------------------------------------ */
/* Auth local (DEMO) — en producción siempre backend + OAuth           */
/* ------------------------------------------------------------------ */

const ADMIN_EMAIL = 'admin@elparche.co'
const KITCHEN_EMAIL = 'cocina@elparche.co'
const DEMO_PASSWORD = 'parche123'

type CredentialMap = Record<string, { password: string; userId: ID }>

const readCredentials = (): CredentialMap => credentialStore.read()
const writeCredentials = (map: CredentialMap) => credentialStore.write(map)

const makeReferralCode = (name: string) =>
  `${name.split(' ')[0].slice(0, 5).toUpperCase()}${Math.floor(100 + Math.random() * 899)}`

const toUser = (
  name: string,
  email: string,
  phone: string | undefined,
  provider: User['provider'],
  role: User['role'] = 'customer',
): User => ({
  id: uid('u'),
  name,
  email,
  phone,
  avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`,
  createdAt: new Date().toISOString(),
  provider,
  role,
  referralCode: makeReferralCode(name),
})

/* ------------------------------------------------------------------ */
/* Payloads                                                            */
/* ------------------------------------------------------------------ */

export interface CreateOrderInput {
  lines: CartLine[]
  address: Address
  paymentMethodId: PaymentMethodId
  couponCode?: string
  pointsRedeemed?: number
  tip?: number
  notes?: string
  deliveryMode?: 'delivery' | 'pickup'
  userId?: ID
  customer: { name: string; email: string; phone?: string }
}

export interface CreateOrderResult {
  order: Order
  payment: Payment
  session: CheckoutSession
}

/* ------------------------------------------------------------------ */
/* API                                                                 */
/* ------------------------------------------------------------------ */

export const api = {
  auth: {
    async signUp(input: {
      name: string
      email: string
      password: string
      phone?: string
    }): Promise<User> {
      if (isRemote) {
        return request<User>('/auth/signup', { method: 'POST', body: input })
      }
      await sleep(500)
      const db = useDb.getState()
      const email = input.email.trim().toLowerCase()
      if (db.users.some((u) => u.email === email)) {
        throw new Error('Ese correo ya está registrado en el parche.')
      }
      const user = toUser(input.name, email, input.phone, 'email')
      db.upsertUser(user)
      db.ensureAccount(user.id)
      const creds = readCredentials()
      creds[email] = { password: input.password, userId: user.id }
      writeCredentials(creds)
      tokenStore.set(`local.${user.id}`)
      return user
    },

    async signIn(input: { email: string; password: string }): Promise<User> {
      if (isRemote) {
        const data = await request<{ user: User; token: string }>('/auth/login', {
          method: 'POST',
          body: input,
        })
        tokenStore.set(data.token)
        return data.user
      }
      await sleep(450)
      const email = input.email.trim().toLowerCase()
      const creds = readCredentials()

      // Cuentas de demostración: admin y domiciliarios entran con esta clave.
      if (input.password === DEMO_PASSWORD) {
        const db = useDb.getState()

        if (email === ADMIN_EMAIL) {
          let admin = db.users.find((u) => u.email === ADMIN_EMAIL)
          if (!admin) {
            admin = toUser('Admin Parche', ADMIN_EMAIL, undefined, 'email', 'admin')
            db.upsertUser(admin)
            db.ensureAccount(admin.id)
          }
          tokenStore.set(`local.${admin.id}`)
          return admin
        }

        // Cocina: cuenta de demostración para la pantalla de preparación.
        if (email === KITCHEN_EMAIL) {
          let kitchen = db.users.find((u) => u.email === KITCHEN_EMAIL)
          if (!kitchen) {
            kitchen = toUser('Cocina Parche', KITCHEN_EMAIL, undefined, 'email', 'kitchen')
            db.upsertUser(kitchen)
            db.ensureAccount(kitchen.id)
          }
          tokenStore.set(`local.${kitchen.id}`)
          return kitchen
        }

        // Domiciliario: cualquier correo registrado en `drivers`.
        const driver = db.drivers.find((d) => d.email.toLowerCase() === email)
        if (driver) {
          let courier = db.users.find((u) => u.email === email)
          if (!courier) {
            courier = toUser(driver.name, email, driver.phone, 'email', 'courier')
            db.upsertUser(courier)
            db.ensureAccount(courier.id)
          }
          tokenStore.set(`local.${courier.id}`)
          return courier
        }
      }

      const entry = creds[email]
      if (!entry || entry.password !== input.password) {
        throw new Error('Correo o contraseña incorrectos.')
      }
      const user = useDb.getState().users.find((u) => u.id === entry.userId)
      if (!user) throw new Error('No encontramos tu cuenta.')
      tokenStore.set(`local.${user.id}`)
      return user
    },

    async signInWithProvider(provider: 'google' | 'apple'): Promise<User> {
      if (isRemote) {
        return request<User>(`/auth/oauth/${provider}`, { method: 'POST' })
      }
      await sleep(700)
      const email = `${provider}.user@elparche.co`
      const db = useDb.getState()
      let user = db.users.find((u) => u.email === email)
      if (!user) {
        user = toUser(provider === 'google' ? 'Parcero Google' : 'Parcero Apple', email, undefined, provider)
        db.upsertUser(user)
        db.ensureAccount(user.id)
      }
      tokenStore.set(`local.${user.id}`)
      return user
    },

    async requestPasswordReset(email: string): Promise<void> {
      if (isRemote) {
        await request('/auth/recover', { method: 'POST', body: { email } })
        return
      }
      await sleep(600)
      void email
    },

    signOut() {
      tokenStore.clear()
    },
  },

  catalog: {
    async listProducts(): Promise<Product[]> {
      if (isRemote) return request<Product[]>('/products')
      return useDb.getState().products
    },
  },

  coupons: {
    async validate(code: string, subtotal: number): Promise<Coupon> {
      if (isRemote) {
        return request<Coupon>('/coupons/validate', { method: 'POST', body: { code, subtotal } })
      }
      await sleep(350)
      const coupon = useDb
        .getState()
        .coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase())
      if (!coupon || !coupon.active) throw new Error('Ese código no existe o ya venció.')
      if (new Date(coupon.expiresAt).getTime() < Date.now()) throw new Error('Ese cupón ya venció.')
      if (subtotal < coupon.minSubtotal) {
        throw new Error(`Este cupón aplica desde $${coupon.minSubtotal.toLocaleString('es-CO')}.`)
      }
      return coupon
    },
  },

  orders: {
    async create(input: CreateOrderInput): Promise<CreateOrderResult> {
      if (isRemote) {
        return request<CreateOrderResult>('/orders', { method: 'POST', body: input })
      }

      const db = useDb.getState()
      const settings = db.settings
      const status = storeStatus(settings)
      if (!status.open) {
        throw new Error(`${CLOSED_MESSAGE} ${status.detail}`)
      }
      const coupon = input.couponCode
        ? db.coupons.find((c) => c.code.toUpperCase() === input.couponCode!.toUpperCase()) ?? null
        : null

      const pricing = computePricing({
        lines: input.lines,
        coupon,
        pointsRedeemed: input.pointsRedeemed ?? 0,
        tip: input.tip ?? 0,
        deliveryMode: input.deliveryMode ?? 'delivery',
        settings,
      })

      if (pricing.subtotal < settings.minOrder) {
        throw new Error(`El pedido mínimo es de $${settings.minOrder.toLocaleString('es-CO')}.`)
      }

      const now = new Date().toISOString()
      const code = orderCode()
      const order: Order = {
        id: uid('ord'),
        code,
        userId: input.userId,
        createdAt: now,
        updatedAt: now,
        status: 'received',
        statusHistory: [{ status: 'received', at: now }],
        items: input.lines.map((l) => ({
          id: l.id,
          productId: l.productId,
          name: l.name,
          image: l.image,
          unitPrice: l.unitPrice,
          quantity: l.quantity,
          selections: l.selections,
          notes: l.notes,
        })),
        subtotal: pricing.subtotal,
        discount: pricing.discount,
        deliveryFee: pricing.deliveryFee,
        tip: pricing.tip,
        total: pricing.total,
        address: input.address,
        paymentMethodId: input.paymentMethodId,
        paymentStatus: 'pending',
        couponCode: coupon?.code,
        pointsEarned: pricing.pointsEarned,
        pointsRedeemed: input.pointsRedeemed ?? 0,
        etaMinutes: settings.avgPrepMinutes + (input.deliveryMode === 'pickup' ? 0 : 12),
        notes: input.notes,
        deliveryMode: input.deliveryMode ?? 'delivery',
        reviewed: false,
      }

      // 1) Persistimos el pedido
      db.addOrder(order)

      // 1.1) Emitimos la factura del pedido
      db.addInvoice(
        buildInvoice({
          order,
          settings,
          sequence: db.invoices.length + 1,
          customerName: input.customer.name,
          customerEmail: input.customer.email,
          customerAddress: [input.address?.line, input.address?.details, input.address?.city]
            .filter(Boolean)
            .join(', '),
          customerPhone: input.customer.phone,
        }),
      )

      // 2) Cobro a través de la pasarela (idempotente por idempotencyKey)
      const method = settings.paymentMethods.find((m) => m.id === input.paymentMethodId)
      const session = await getPaymentGateway().createSession({
        orderId: order.id,
        orderCode: order.code,
        amount: Math.round(pricing.total),
        currency: 'COP',
        method: input.paymentMethodId,
        provider: method?.provider ?? 'cash',
        customer: input.customer,
        idempotencyKey: `${order.id}:${Math.round(pricing.total)}`,
      })

      const payment: Payment = {
        id: uid('pay'),
        orderId: order.id,
        method: input.paymentMethodId,
        provider: method?.provider ?? 'cash',
        status: session.status,
        amount: Math.round(pricing.total),
        currency: 'COP',
        providerRef: session.reference,
        idempotencyKey: `${order.id}:${Math.round(pricing.total)}`,
        createdAt: now,
        updatedAt: now,
      }
      db.addPayment(payment)

      // 3) Sincronizamos el resultado del cobro con el pedido persistido
      if (session.status === 'approved') {
        db.setOrderStatus(order.id, 'confirmed')
        db.patchOrder(order.id, { paymentStatus: 'approved' })
        order.status = 'confirmed'
        order.paymentStatus = 'approved'
        order.statusHistory = [...order.statusHistory, { status: 'confirmed', at: now }]
      } else {
        db.patchOrder(order.id, { paymentStatus: session.status })
        order.paymentStatus = session.status
      }

      // 4) Efectos secundarios de negocio
      if (coupon) db.registerCouponUse(coupon.code)
      for (const line of input.lines) {
        const product = db.products.find((p) => p.id === line.productId)
        if (product?.dropId) {
          for (let i = 0; i < line.quantity; i++) db.takeDropUnit(product.dropId)
        }
      }

      if (input.userId) {
        db.registerOrderStats(input.userId, pricing.total)
        if (input.pointsRedeemed) db.spendPoints(input.userId, input.pointsRedeemed)
        const account = useDb.getState().accounts[input.userId] ?? emptyAccount(input.userId)
        if (account.totalOrders >= 1) db.unlockBadge('b_first')
        if (account.totalOrders >= 5) db.unlockBadge('b_crew')
        if (levelForPoints(account.lifetimePoints).id === 'street_boss') db.unlockBadge('b_boss')

        const newProgress = db.missions.map((m) => {
          if (m.type === 'orders_count') return { id: m.id, progress: m.progress + 1 }
          if (m.type === 'monthly_orders') return { id: m.id, progress: m.progress + 1 }
          if (m.type === 'combo' && input.lines.some((l) => l.isCombo)) {
            return { id: m.id, progress: m.progress + 1 }
          }
          if (m.type === 'spend_amount') return { id: m.id, progress: m.progress + pricing.total }
          return null
        })
        newProgress.forEach((entry) => {
          if (entry) db.setMissionProgress(entry.id, entry.progress)
        })
      }

      db.pushNotification({
        type: 'order',
        title: `Pedido ${order.code} recibido`,
        body: 'Estamos confirmando tu pedido. Te avisamos en cada paso.',
        emoji: '🟡',
        actionUrl: `/tracking/${order.id}`,
      })

      if (pricing.pointsEarned > 0 && input.userId) {
        db.pushNotification({
          type: 'points',
          title: `Ganaste ${pricing.pointsEarned} Street Points`,
          body: 'Sigue así y desbloqueas recompensas.',
          emoji: '🎁',
          actionUrl: '/rewards',
        })
      }

      return { order, payment, session }
    },

    async list(userId?: ID): Promise<Order[]> {
      if (isRemote) return request<Order[]>('/orders', { query: { userId } })
      const orders = useDb.getState().orders
      return userId ? orders.filter((o) => o.userId === userId) : orders
    },

    async get(id: ID): Promise<Order | undefined> {
      if (isRemote) return request<Order>(`/orders/${id}`)
      return useDb.getState().orders.find((o) => o.id === id)
    },

    async setStatus(id: ID, status: OrderStatus): Promise<void> {
      if (isRemote) {
        await request(`/orders/${id}/status`, { method: 'PATCH', body: { status } })
        return
      }
      const db = useDb.getState()
      db.setOrderStatus(id, status)
      const order = useDb.getState().orders.find((o) => o.id === id)
      if (order) {
        db.pushNotification({
          type: 'order',
          title: `Pedido ${order.code}: ${ORDER_STATUS_LABEL[status]}`,
          body: 'Toca para ver el seguimiento en tiempo real.',
          emoji: ORDER_STATUS_EMOJI[status],
          actionUrl: `/tracking/${id}`,
        })
      }
    },
  },

  payments: {
    async retry(orderId: ID): Promise<Payment | undefined> {
      if (isRemote) return request<Payment>(`/payments/${orderId}/retry`, { method: 'POST' })
      await sleep(600)
      const db = useDb.getState()
      const payment = db.payments.find((p) => p.orderId === orderId)
      if (!payment) return undefined
      db.setPaymentStatus(payment.id, 'approved')
      db.setOrderStatus(orderId, 'confirmed')
      return { ...payment, status: 'approved' }
    },
  },

  invoices: {
    async list(): Promise<Invoice[]> {
      if (isRemote) return request<Invoice[]>('/invoices')
      return useDb.getState().invoices
    },

    async byOrder(orderId: ID): Promise<Invoice | undefined> {
      if (isRemote) return request<Invoice>(`/invoices/order/${orderId}`)
      return useDb.getState().invoices.find((invoice) => invoice.orderId === orderId)
    },

    /** Envía la factura al correo del cliente. En modo local lo simula. */
    async send(id: ID): Promise<Invoice | undefined> {
      if (isRemote) return request<Invoice>(`/invoices/${id}/send`, { method: 'POST' })
      await sleep(700)
      const db = useDb.getState()
      const invoice = db.invoices.find((item) => item.id === id)
      if (!invoice) return undefined
      const sentAt = new Date().toISOString()
      db.patchInvoice(id, { status: 'sent', sentAt })
      db.pushNotification({
        type: 'order',
        title: `Factura ${invoice.number} enviada`,
        body: `La enviamos a ${invoice.customerEmail}.`,
        emoji: '🧾',
        actionUrl: `/invoice/${invoice.orderId}`,
      })
      return { ...invoice, status: 'sent', sentAt }
    },

    async setStatus(id: ID, status: InvoiceStatus): Promise<void> {
      if (isRemote) {
        await request(`/invoices/${id}/status`, { method: 'PATCH', body: { status } })
        return
      }
      useDb.getState().patchInvoice(id, { status })
    },
  },

  reviews: {
    async create(review: Omit<Review, 'id' | 'createdAt' | 'likes'>): Promise<Review> {
      if (isRemote) return request<Review>('/reviews', { method: 'POST', body: review })
      await sleep(400)
      const db = useDb.getState()
      const created: Review = {
        ...review,
        id: uid('rev'),
        createdAt: new Date().toISOString(),
        likes: 0,
      }
      db.addReview(created)
      if (review.orderId) db.markOrderReviewed(review.orderId)
      const reviewMission = db.missions.find((m) => m.type === 'review')
      if (reviewMission) db.setMissionProgress(reviewMission.id, reviewMission.progress + 1)
      if (review.userId) db.addPoints(review.userId, 80)
      db.pushNotification({
        type: 'points',
        title: '¡Gracias por tu reseña! +80 puntos',
        body: 'Tu opinión ayuda a todo el parche.',
        emoji: '⭐',
        actionUrl: '/community',
      })
      return created
    },
  },
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  received: 'Pedido recibido',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Listo',
  on_the_way: 'En camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

export const ORDER_STATUS_EMOJI: Record<OrderStatus, string> = {
  received: '🟡',
  confirmed: '✅',
  preparing: '👨‍🍳',
  ready: '🍔',
  on_the_way: '🛵',
  delivered: '🏠',
  cancelled: '❌',
}

export const ORDER_FLOW: OrderStatus[] = [
  'received',
  'confirmed',
  'preparing',
  'ready',
  'on_the_way',
  'delivered',
]
