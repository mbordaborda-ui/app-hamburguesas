/**
 * ============================================================================
 *  CAPA DE PAGOS — ARQUITECTURA ePayco-READY
 * ============================================================================
 *
 *  Regla de oro: las credenciales privadas de ePayco
 *  (P_KEY, P_CUST_ID_CLIENTE, p_cust_id_cliente, llave de firma, etc.)
 *  NUNCA viven en el frontend. Viven en el backend / Edge Function.
 *
 *  Flujo real (producción):
 *
 *   1. Frontend  -> POST {BACKEND}/payments/epayco/session
 *                  { orderId, amount, method, currency, customer }
 *   2. Backend   -> crea la sesión con las llaves privadas y devuelve
 *                  { reference, publicKey, redirectUrl } (solo datos públicos)
 *   3. Frontend  -> redirige / abre el checkout de ePayco
 *   4. ePayco    -> confirma por webhook a {BACKEND}/payments/epayco/webhook
 *   5. Backend   -> verifica la firma, actualiza el pago y el pedido
 *   6. Frontend  -> consulta GET {BACKEND}/payments/{reference}
 *
 *  Mientras `VITE_API_URL` no esté configurado, la app usa `LocalGateway`,
 *  un simulador determinista que respeta exactamente el mismo contrato.
 */

import { ApiError, PAYMENTS_API_URL, isRemote, request } from '@/services/http'
import { uid } from '@/lib/utils'
import type { PaymentMethodId, PaymentProvider, PaymentStatus } from '@/types'

export interface CheckoutSessionInput {
  orderId: string
  orderCode: string
  amount: number
  currency: 'COP'
  method: PaymentMethodId
  provider: PaymentProvider
  customer: { name: string; email: string; phone?: string }
  idempotencyKey: string
}

export interface CheckoutSession {
  reference: string
  amount: number
  currency: 'COP'
  method: PaymentMethodId
  status: PaymentStatus
  requiresRedirect: boolean
  redirectUrl?: string
  /** Solo la llave PÚBLICA de ePayco puede llegar al navegador. */
  publicKey?: string
  message?: string
}

export interface PaymentGateway {
  readonly id: string
  createSession(input: CheckoutSessionInput): Promise<CheckoutSession>
  getStatus(reference: string): Promise<PaymentStatus>
  refund(reference: string, amount: number): Promise<boolean>
}

/* ------------------------------------------------------------------ */
/* Simulador local (demo / offline)                                    */
/* ------------------------------------------------------------------ */

const simulatedRefs = new Map<string, { status: PaymentStatus; attempts: number }>()

class LocalGateway implements PaymentGateway {
  readonly id = 'local'

  async createSession(input: CheckoutSessionInput): Promise<CheckoutSession> {
    await new Promise((r) => setTimeout(r, 650))
    const reference = `EP-LOCAL-${input.orderCode}-${uid('r').slice(-5).toUpperCase()}`

    // Los métodos contra-entrega y wallets quedan pendientes hasta confirmar.
    const instant = input.method === 'card'
    const status: PaymentStatus = instant ? 'approved' : 'pending'
    simulatedRefs.set(reference, { status, attempts: 0 })

    return {
      reference,
      amount: input.amount,
      currency: input.currency,
      method: input.method,
      status,
      requiresRedirect: false,
      message: instant
        ? 'Pago aprobado (simulado).'
        : 'Pago registrado. Se confirmará al entregar o desde la app del banco.',
    }
  }

  async getStatus(reference: string): Promise<PaymentStatus> {
    return simulatedRefs.get(reference)?.status ?? 'pending'
  }

  async refund(reference: string, _amount: number): Promise<boolean> {
    const entry = simulatedRefs.get(reference)
    if (!entry) return false
    entry.status = 'refunded'
    return true
  }
}

/* ------------------------------------------------------------------ */
/* ePayco real (a través del backend)                                  */
/* ------------------------------------------------------------------ */

class EpaycoGateway implements PaymentGateway {
  readonly id = 'epayco'

  async createSession(input: CheckoutSessionInput): Promise<CheckoutSession> {
    return request<CheckoutSession>('/payments/epayco/session', {
      method: 'POST',
      body: input,
      baseUrl: PAYMENTS_API_URL || undefined,
    })
  }

  async getStatus(reference: string): Promise<PaymentStatus> {
    const data = await request<{ status: PaymentStatus }>(
      `/payments/epayco/status/${encodeURIComponent(reference)}`,
      { baseUrl: PAYMENTS_API_URL || undefined },
    )
    return data.status
  }

  async refund(reference: string, amount: number): Promise<boolean> {
    try {
      await request(`/payments/epayco/refund`, {
        method: 'POST',
        body: { reference, amount },
        baseUrl: PAYMENTS_API_URL || undefined,
      })
      return true
    } catch (error) {
      if (error instanceof ApiError) return false
      throw error
    }
  }
}

/* ------------------------------------------------------------------ */
/* Factory                                                             */
/* ------------------------------------------------------------------ */

/**
 * Usa ePayco real si hay backend de pagos (`VITE_PAYMENTS_API_URL`) o si toda la
 * app está en modo remoto (`VITE_API_URL`). Si no, usa el simulador local.
 */
let gateway: PaymentGateway =
  PAYMENTS_API_URL || isRemote ? new EpaycoGateway() : new LocalGateway()

export const getPaymentGateway = () => gateway

/** Permite inyectar una pasarela (tests o cambio de proveedor en runtime). */
export const setPaymentGateway = (next: PaymentGateway) => {
  gateway = next
}

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
}

export const paymentStatusTone: Record<PaymentStatus, string> = {
  pending: 'text-red border-red/40 bg-red/10',
  processing: 'text-yellow border-yellow/40 bg-yellow/10',
  approved: 'text-lime border-lime/40 bg-lime/10',
  rejected: 'text-flame border-flame/40 bg-flame/10',
  cancelled: 'text-ash border-ash/30 bg-ash/10',
  refunded: 'text-grape border-grape/40 bg-grape/10',
}
