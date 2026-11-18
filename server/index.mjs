/**
 * EL PARCHE — backend de pagos y pedidos.
 *
 * Sin dependencias: `node:http` + `node:sqlite` (Node 22.5+).
 *
 *   npm run server        # arranca en http://localhost:8787
 *   npm run server:dev    # con --watch
 *
 * Endpoints:
 *   GET    /health
 *   GET    /orders                     · lista pedidos
 *   POST   /orders                     · registra/actualiza un pedido
 *   GET    /orders/:id
 *   PATCH  /orders/:id/status
 *   GET    /payments
 *   POST   /payments/epayco/session    · crea la sesión de pago (idempotente)
 *   GET    /payments/epayco/status/:ref
 *   POST   /payments/epayco/webhook    · confirmación firmada de ePayco
 *   POST   /payments/epayco/refund
 *   GET    /pay/epayco/checkout        · checkout simulado (modo test)
 *   POST   /pay/epayco/confirm         · dispara el webhook y vuelve a la app
 */

import { createServer } from 'node:http'
import { randomBytes } from 'node:crypto'
import { sendJson, sendHtml, sendRedirect, sendNoContent, readBody } from './util.mjs'
import {
  getOrder,
  getPayment,
  getPaymentByIdempotency,
  insertPayment,
  insertWebhookEvent,
  listOrders,
  listPayments,
  setOrderStatus,
  setPaymentStatus,
  upsertOrder,
} from './db.mjs'
import { MODE, PUBLIC_KEY, buildConfirmation, checkoutHtml, verifyConfirmation } from './epayco.mjs'

const PORT = Number(process.env.PORT ?? 8787)
const PUBLIC_URL = process.env.PUBLIC_URL ?? `http://localhost:${PORT}`
const APP_URL = process.env.APP_URL ?? 'http://localhost:5180'

/* ------------------------------------------------------------------ */
/* Lógica de negocio                                                   */
/* ------------------------------------------------------------------ */

function sessionResponse(payment) {
  const requiresRedirect = payment.provider === 'epayco'
  return {
    reference: payment.reference,
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method,
    status: payment.status,
    requiresRedirect,
    redirectUrl: requiresRedirect
      ? `${PUBLIC_URL}/pay/epayco/checkout?ref=${encodeURIComponent(payment.reference)}`
      : undefined,
    publicKey: PUBLIC_KEY,
    message: requiresRedirect
      ? 'Redirigiendo al checkout seguro de ePayco…'
      : 'Pago registrado. Se confirma contra entrega.',
  }
}

function createSession(input) {
  const { orderId, orderCode, amount, currency = 'COP', method, provider, customer, idempotencyKey } =
    input ?? {}

  if (!orderId || !amount || !method) {
    return { status: 400, error: 'orderId, amount y method son obligatorios' }
  }

  const existing = getOrder(orderId)
  if (existing && Number(existing.amount) !== Number(amount)) {
    return { status: 409, error: 'el monto no coincide con el pedido registrado' }
  }
  if (!existing) {
    upsertOrder({
      id: orderId,
      code: orderCode ?? orderId,
      amount: Number(amount),
      currency,
      status: 'pending',
      customerName: customer?.name,
      customerEmail: customer?.email,
      customerPhone: customer?.phone,
    })
  }

  if (idempotencyKey) {
    const prior = getPaymentByIdempotency(idempotencyKey)
    if (prior) return { session: sessionResponse(prior) }
  }

  const reference = `EP-${orderCode ?? orderId}-${randomBytes(3).toString('hex').toUpperCase()}`
  const payment = insertPayment({
    reference,
    orderId,
    method,
    provider: provider ?? 'epayco',
    amount: Number(amount),
    currency,
    status: 'pending',
    idempotencyKey,
  })
  return { session: sessionResponse(payment) }
}

/** Procesa una confirmación de ePayco: valida firma y actualiza pago + pedido. */
function handleConfirmation(payload) {
  const signatureOk = verifyConfirmation(payload)
  insertWebhookEvent(payload.x_ref_payco, payload, signatureOk)

  if (!signatureOk) return { ok: false, error: 'firma inválida' }

  const payment = getPayment(payload.x_ref_payco)
  if (!payment) return { ok: false, error: 'referencia desconocida' }

  const approved = Number(payload.x_cod_response) === 1
  const status = approved ? 'approved' : 'rejected'
  setPaymentStatus(payload.x_ref_payco, status, approved ? undefined : payload.x_response)
  setOrderStatus(payment.order_id, approved ? 'confirmed' : 'pending')
  return { ok: true, reference: payload.x_ref_payco, status }
}

/* ------------------------------------------------------------------ */
/* Router                                                              */
/* ------------------------------------------------------------------ */

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', PUBLIC_URL)
  const pathname = url.pathname
  const method = req.method ?? 'GET'

  if (method === 'OPTIONS') return sendNoContent(res)

  try {
    if (method === 'GET' && pathname === '/health') {
      return sendJson(res, 200, { ok: true, mode: MODE, time: new Date().toISOString() })
    }

    if (method === 'GET' && pathname === '/orders') {
      return sendJson(res, 200, listOrders())
    }

    if (method === 'POST' && pathname === '/orders') {
      const body = await readBody(req)
      if (!body.id || !body.amount) return sendJson(res, 400, { error: 'id y amount obligatorios' })
      return sendJson(
        res,
        201,
        upsertOrder({
          id: body.id,
          code: body.code ?? body.id,
          amount: Number(body.amount),
          currency: body.currency ?? 'COP',
          status: body.status ?? 'pending',
          customerName: body.customer?.name,
          customerEmail: body.customer?.email,
          customerPhone: body.customer?.phone,
        }),
      )
    }

    const orderMatch = pathname.match(/^\/orders\/([^/]+)$/)
    if (orderMatch) {
      const id = decodeURIComponent(orderMatch[1])
      if (method === 'GET') {
        const order = getOrder(id)
        return order
          ? sendJson(res, 200, order)
          : sendJson(res, 404, { error: 'pedido no encontrado' })
      }
      if (method === 'PATCH') {
        const body = await readBody(req)
        if (!body.status) return sendJson(res, 400, { error: 'status obligatorio' })
        const order = setOrderStatus(id, body.status)
        return order
          ? sendJson(res, 200, order)
          : sendJson(res, 404, { error: 'pedido no encontrado' })
      }
    }

    if (method === 'GET' && pathname === '/payments') {
      return sendJson(res, 200, listPayments())
    }

    if (method === 'POST' && pathname === '/payments/epayco/session') {
      const body = await readBody(req)
      const result = createSession(body)
      if (result.error) return sendJson(res, result.status ?? 400, { error: result.error })
      return sendJson(res, 201, result.session)
    }

    const statusMatch = pathname.match(/^\/payments\/epayco\/status\/([^/]+)$/)
    if (method === 'GET' && statusMatch) {
      const reference = decodeURIComponent(statusMatch[1])
      const payment = getPayment(reference)
      if (!payment) return sendJson(res, 404, { error: 'referencia desconocida' })
      return sendJson(res, 200, {
        reference,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
      })
    }

    if (method === 'POST' && pathname === '/payments/epayco/webhook') {
      const payload = await readBody(req)
      const result = handleConfirmation(payload)
      return sendJson(res, result.ok ? 200 : 400, result)
    }

    if (method === 'POST' && pathname === '/payments/epayco/refund') {
      const body = await readBody(req)
      const payment = getPayment(body.reference)
      if (!payment) return sendJson(res, 404, { error: 'referencia desconocida' })
      setPaymentStatus(body.reference, 'refunded')
      setOrderStatus(payment.order_id, 'cancelled')
      return sendJson(res, 200, { ok: true, reference: body.reference, status: 'refunded' })
    }

    if (method === 'GET' && pathname === '/pay/epayco/checkout') {
      const reference = url.searchParams.get('ref') ?? ''
      const payment = getPayment(reference)
      if (!payment) return sendHtml(res, 404, '<h1>Referencia no encontrada</h1>')
      return sendHtml(res, 200, checkoutHtml({
        reference,
        payment,
        order: getOrder(payment.order_id),
        mode: MODE,
      }))
    }

    if (method === 'POST' && pathname === '/pay/epayco/confirm') {
      const body = await readBody(req)
      const reference = body.ref
      const payment = getPayment(reference)
      if (!payment) return sendHtml(res, 404, '<h1>Referencia no encontrada</h1>')

      const payload = buildConfirmation(
        reference,
        body.decision === 'approve' ? 'approve' : 'reject',
        payment,
      )
      const result = handleConfirmation(payload)
      const status = result.ok ? payload.x_transaction_state.toLowerCase() : 'error'
      return sendRedirect(
        res,
        `${APP_URL}/checkout/response?ref=${encodeURIComponent(reference)}&status=${encodeURIComponent(status)}`,
      )
    }

    return sendJson(res, 404, { error: 'ruta no encontrada', path: pathname })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'error del servidor'
    return sendJson(res, 500, { error: message })
  }
})

server.listen(PORT, () => {
  console.log(`🍔 EL PARCHE backend escuchando en ${PUBLIC_URL} (modo ${MODE})`)
  console.log(`   Frontend esperado en ${APP_URL}`)
})
