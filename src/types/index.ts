export type ID = string

/* ------------------------------------------------------------------ */
/* Usuarios y direcciones                                              */
/* ------------------------------------------------------------------ */

export type LoyaltyLevelId = 'rookie' | 'crew' | 'street_boss' | 'legend'

export type UserRole = 'customer' | 'admin' | 'courier' | 'kitchen'

export interface User {
  id: ID
  name: string
  email: string
  phone?: string
  avatar?: string
  createdAt: string
  provider: 'email' | 'google' | 'apple'
  role: UserRole
  referralCode: string
  referredBy?: string
}

/* ------------------------------------------------------------------ */
/* Domiciliarios                                                       */
/* ------------------------------------------------------------------ */

export interface Driver {
  id: ID
  name: string
  /** Con este correo inicia sesión el domiciliario. */
  email: string
  phone: string
  vehicle: 'moto' | 'bici' | 'carro'
  photo?: string
  rating: number
  active: boolean
}

export interface Address {
  id: ID
  label: 'Casa' | 'Trabajo' | 'Otra' | string
  line: string
  details?: string
  city: string
  neighborhood?: string
  lat?: number
  lng?: number
  isDefault?: boolean
}

/* ------------------------------------------------------------------ */
/* Catálogo                                                            */
/* ------------------------------------------------------------------ */

export interface Category {
  id: ID
  slug: string
  name: string
  emoji: string
  order: number
  visible: boolean
}

export type ProductBadge =
  | 'mas_vendido'
  | 'nuevo'
  | 'picante'
  | 'premium'
  | 'veggie'
  | 'drop'
  | 'secreto'
  | 'promo'

export interface ProductOption {
  id: ID
  name: string
  price: number
  default?: boolean
  soldOut?: boolean
}

export interface OptionGroup {
  id: ID
  name: string
  description?: string
  type: 'single' | 'multi'
  required?: boolean
  min?: number
  max?: number
  options: ProductOption[]
}

export interface Product {
  id: ID
  slug: string
  name: string
  tagline: string
  description: string
  price: number
  compareAtPrice?: number
  image: string
  categoryId: ID
  rating: number
  reviewsCount: number
  tags: string[]
  badges: ProductBadge[]
  spicy: 0 | 1 | 2 | 3
  isAvailable: boolean
  isNew?: boolean
  isBestSeller?: boolean
  isSecret?: boolean
  unlockLevel?: LoyaltyLevelId
  unlockCode?: string
  prepMinutes: number
  calories?: number
  ingredients: string[]
  optionGroups: OptionGroup[]
  dropId?: ID
  stock?: number
  comboContents?: string[]
  savings?: number
}

/* ------------------------------------------------------------------ */
/* Carrito                                                             */
/* ------------------------------------------------------------------ */

export interface SelectedOption {
  groupId: ID
  groupName: string
  optionId: ID
  name: string
  price: number
}

export interface CartLine {
  id: ID
  productId: ID
  name: string
  image: string
  basePrice: number
  unitPrice: number
  quantity: number
  selections: SelectedOption[]
  notes?: string
  isCombo?: boolean
  comboContents?: string[]
}

/* ------------------------------------------------------------------ */
/* Pedidos                                                             */
/* ------------------------------------------------------------------ */

export type OrderStatus =
  | 'received'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled'

export interface StatusEvent {
  status: OrderStatus
  at: string
}

/** Copia del domiciliario asignado en el momento del despacho. */
export interface Courier {
  name: string
  phone: string
  rating: number
  vehicle: 'moto' | 'bici' | 'carro'
  photo?: string
}

export interface OrderItem {
  id: ID
  productId: ID
  name: string
  image: string
  unitPrice: number
  quantity: number
  selections: SelectedOption[]
  notes?: string
}

export interface Order {
  id: ID
  code: string
  userId?: ID
  createdAt: string
  updatedAt: string
  status: OrderStatus
  statusHistory: StatusEvent[]
  items: OrderItem[]
  subtotal: number
  discount: number
  deliveryFee: number
  tip: number
  total: number
  address: Address
  paymentMethodId: PaymentMethodId
  paymentStatus: PaymentStatus
  couponCode?: string
  pointsEarned: number
  pointsRedeemed: number
  etaMinutes: number
  /** Domiciliario asignado desde el panel o el módulo de domiciliario. */
  courierId?: ID
  courier?: Courier
  notes?: string
  deliveryMode: 'delivery' | 'pickup'
  reviewed?: boolean
  /** IDs de ítems "adicionales" (bebidas/acompañamientos) ya empacados por cocina. */
  packedItems?: ID[]
  /** IDs de ítems ya preparados por cocina (uno por uno). */
  preparedItems?: ID[]
  /** Cuándo cocina confirmó que el pedido está listo y empacado. */
  readyConfirmedAt?: string
}

/* ------------------------------------------------------------------ */
/* Pagos                                                               */
/* ------------------------------------------------------------------ */

export type PaymentMethodId =
  | 'card'
  | 'pse'
  | 'nequi'
  | 'daviplata'
  | 'cash'
  | 'bancolombia'
  | 'efecty'

export type PaymentProvider = 'epayco' | 'cash' | 'wallet'

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'refunded'

export interface PaymentMethod {
  id: PaymentMethodId
  label: string
  description: string
  emoji: string
  provider: PaymentProvider
  enabled: boolean
  requiresBackend: boolean
  surcharge?: number
  instructions?: string
}

export interface Payment {
  id: ID
  orderId: ID
  method: PaymentMethodId
  provider: PaymentProvider
  status: PaymentStatus
  amount: number
  currency: 'COP'
  providerRef?: string
  idempotencyKey: string
  createdAt: string
  updatedAt: string
  failureReason?: string
}

/* ------------------------------------------------------------------ */
/* Facturas                                                            */
/* ------------------------------------------------------------------ */

export type InvoiceStatus = 'issued' | 'sent' | 'paid' | 'void'

/** Régimen / responsabilidad tributaria del emisor (Colombia). */
export type TaxRegime =
  | 'responsable_iva'
  | 'no_responsable'
  | 'simple'
  | 'gran_contribuyente'

/** Tipo de documento del adquirente. `final` = consumidor final. */
export type CustomerDocType = 'cc' | 'nit' | 'ce' | 'pp' | 'final'

/** Resolución DIAN que habilita la numeración de la factura. */
export interface InvoiceResolution {
  prefix: string
  number: string
  date?: string
  from: number
  to: number
}

/** Datos legales del emisor (obligado a facturar). */
export interface InvoiceIssuer {
  name: string
  /** NIT con dígito de verificación, ej. "901.234.567-8". */
  nit?: string
  taxRegime?: TaxRegime
  address?: string
  phone?: string
  email?: string
  resolution?: InvoiceResolution
}

/** Datos legales del adquirente. */
export interface InvoiceCustomer {
  name: string
  email: string
  docType?: CustomerDocType
  docNumber?: string
  address?: string
  phone?: string
}

export interface InvoiceItem {
  name: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Invoice {
  id: ID
  /** Consecutivo legible, ej. "EP-F-000042". */
  number: string
  orderId: ID
  orderCode: string
  userId?: ID
  customerName: string
  customerEmail: string
  issuedAt: string
  sentAt?: string
  status: InvoiceStatus
  currency: 'COP'
  items: InvoiceItem[]
  subtotal: number
  discount: number
  deliveryFee: number
  tip: number
  /** IVA incluido en el subtotal (0 si el local no cobra IVA discriminado). */
  tax: number
  /** Tarifa de IVA aplicada al emitir (para discriminar en el documento). */
  taxRate?: number
  /** Impuesto Nacional al Consumo incluido (restaurantes, ej. 8%). */
  consumptionTax?: number
  /** Tarifa del INC aplicada al emitir. */
  consumptionTaxRate?: number
  total: number
  paymentMethod: PaymentMethodId
  deliveryMode: 'delivery' | 'pickup'
  /** Snapshot legal del emisor al momento de emitir (Colombia). */
  issuer?: InvoiceIssuer
  /** Snapshot legal del adquirente al momento de emitir. */
  customer?: InvoiceCustomer
  /** Código Único de Factura Electrónica (simulado para esta demo). */
  cufe?: string
}

/* ------------------------------------------------------------------ */
/* Fidelización                                                        */
/* ------------------------------------------------------------------ */

export interface LoyaltyLevel {
  id: LoyaltyLevelId
  name: string
  emoji: string
  minPoints: number
  multiplier: number
  perks: string[]
  color: string
}

export interface LoyaltyAccount {
  userId: ID
  points: number
  lifetimePoints: number
  level: LoyaltyLevelId
  streak: number
  lastOrderAt?: string
  totalOrders: number
  totalSpent: number
}

export type MissionType =
  | 'orders_count'
  | 'try_new'
  | 'refer_friend'
  | 'monthly_orders'
  | 'review'
  | 'spend_amount'
  | 'combo'

export interface Mission {
  id: ID
  title: string
  description: string
  type: MissionType
  goal: number
  progress: number
  rewardPoints: number
  emoji: string
  claimed: boolean
}

export interface Reward {
  id: ID
  title: string
  description: string
  cost: number
  emoji: string
  type: 'discount' | 'free_item' | 'topping' | 'exclusive'
  requiresLevel?: LoyaltyLevelId
  available: boolean
}

export interface Badge {
  id: ID
  name: string
  description: string
  emoji: string
  unlockedAt?: string
}

export interface Referral {
  code: string
  invited: number
  joined: number
  pointsEarned: number
}

/* ------------------------------------------------------------------ */
/* Cupones, reseñas, notificaciones, drops                             */
/* ------------------------------------------------------------------ */

export type CouponType = 'percent' | 'fixed' | 'free_delivery'

export interface Coupon {
  id: ID
  code: string
  description: string
  type: CouponType
  value: number
  minSubtotal: number
  maxDiscount?: number
  expiresAt: string
  conditions: string
  active: boolean
  usageLimit?: number
  usedCount: number
  emoji: string
}

export interface Review {
  id: ID
  userId?: ID
  userName: string
  avatar: string
  orderId?: ID
  productId?: ID
  productName?: string
  ratings: {
    burger: number
    fries: number
    delivery: number
    overall: number
  }
  comment: string
  photo?: string
  createdAt: string
  likes: number
  featured?: boolean
}

export type NotificationType =
  | 'order'
  | 'promo'
  | 'new_product'
  | 'drop'
  | 'points'
  | 'reward'
  | 'winback'

export interface AppNotification {
  id: ID
  type: NotificationType
  title: string
  body: string
  emoji: string
  createdAt: string
  read: boolean
  actionUrl?: string
}

export interface Drop {
  id: ID
  productId: ID
  name: string
  dropNumber: number
  tagline: string
  image: string
  total: number
  remaining: number
  price: number
  startsAt: string
  endsAt: string
  active: boolean
  emoji: string
}

/* ------------------------------------------------------------------ */
/* Configuración                                                       */
/* ------------------------------------------------------------------ */

export interface Shift {
  /** Apertura en formato "HH:MM". */
  open: string
  /** Cierre en formato "HH:MM". Si es menor que `open`, cruza medianoche. */
  close: string
}

export interface DayHours {
  /** 0 = domingo … 6 = sábado (igual que `Date.getDay()`). */
  day: number
  /** Turnos del día. Lista vacía = cerrado todo el día. */
  shifts: Shift[]
}

export type WeeklyHours = DayHours[]

export interface Settings {
  storeName: string
  tagline: string
  whatsapp: string
  currency: 'COP'
  isOpen: boolean
  deliveryFee: number
  freeDeliveryFrom: number
  minOrder: number
  avgPrepMinutes: number
  pointsPerCurrency: number
  pointsValue: number
  taxRate: number
  paymentMethods: PaymentMethod[]
  announcement: string
  /** Horario de atención por día de la semana. */
  hours: WeeklyHours

  /* --- Datos legales de facturación (Colombia) --- */
  /** Razón social del emisor, ej. "EL PARCHE S.A.S.". */
  legalName?: string
  /** NIT con dígito de verificación, ej. "901.234.567-8". */
  nit?: string
  /** Régimen o responsabilidad tributaria. */
  taxRegime?: TaxRegime
  /** Dirección fiscal del establecimiento. */
  legalAddress?: string
  legalEmail?: string
  legalPhone?: string
  /** Prefijo autorizado del consecutivo, ej. "EP-F". */
  invoicePrefix?: string
  /** Número de la resolución DIAN de habilitación de numeración. */
  resolutionNumber?: string
  /** Fecha de la resolución (YYYY-MM-DD). */
  resolutionDate?: string
  /** Rango autorizado desde. */
  resolutionFrom?: number
  /** Rango autorizado hasta. */
  resolutionTo?: number
  /** Impuesto Nacional al Consumo para restaurantes (ej. 0.08). */
  consumptionTaxRate?: number
}

/* ------------------------------------------------------------------ */
/* Navegación / UI                                                     */
/* ------------------------------------------------------------------ */

export interface Upsell {
  id: ID
  title: string
  description: string
  emoji: string
  productId?: ID
  addPrice: number
  kind: 'topping' | 'drink' | 'upgrade' | 'product'
}
