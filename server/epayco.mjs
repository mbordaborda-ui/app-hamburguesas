/**
 * Integración ePayco.
 *
 * En `EPAYCO_MODE=test` (por defecto) la firma y las respuestas se calculan con
 * llaves de prueba, así el flujo completo (sesión → checkout → webhook → estado)
 * funciona sin credenciales reales. Con `EPAYCO_MODE=live` se usan las llaves
 * del entorno (`P_CUST_ID_CLIENTE`, `P_KEY`, `PUBLIC_KEY`).
 *
 * La firma de confirmación de ePayco es:
 *   md5(P_CUST_ID_CLIENTE ^ P_KEY ^ x_ref_payco ^ x_transaction_id ^ x_amount ^ x_currency_code)
 */

import { createHash } from 'node:crypto'

export const MODE = process.env.EPAYCO_MODE ?? 'test'
export const P_CUST_ID_CLIENTE = process.env.P_CUST_ID_CLIENTE ?? 'test_customer'
export const P_KEY = process.env.P_KEY ?? 'test_key'
export const PUBLIC_KEY = process.env.PUBLIC_KEY ?? 'test_public_key'

export function signConfirmation({ ref, transactionId, amount, currency }) {
  const raw = `${P_CUST_ID_CLIENTE}^${P_KEY}^${ref}^${transactionId}^${amount}^${currency}`
  return createHash('md5').update(raw).digest('hex')
}

export function verifyConfirmation(payload) {
  const expected = signConfirmation({
    ref: payload.x_ref_payco,
    transactionId: payload.x_transaction_id,
    amount: payload.x_amount,
    currency: payload.x_currency_code,
  })
  return expected === payload.x_signature
}

/** Construye un payload de confirmación con el formato de ePayco (simulado). */
export function buildConfirmation(reference, decision, payment) {
  const transactionId = Math.floor(100000 + Math.random() * 899999)
  const amount = String(payment.amount)
  const currency = payment.currency ?? 'COP'
  const approved = decision === 'approve'

  return {
    x_ref_payco: reference,
    x_transaction_id: transactionId,
    x_amount: amount,
    x_currency_code: currency,
    x_cod_response: approved ? 1 : 2,
    x_response: approved ? 'Aceptada' : 'Rechazada',
    x_transaction_state: approved ? 'Aceptada' : 'Rechazada',
    x_signature: signConfirmation({ ref: reference, transactionId, amount, currency }),
  }
}

const formatCop = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)

/** Página de checkout de ePayco simulada (con los botones de pago). */
export function checkoutHtml({ reference, payment, order, mode }) {
  const amount = formatCop(payment.amount)
  const customer = order?.customer_name ?? 'Cliente'

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>ePayco · Pago seguro</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: #0b0b0d; color: #f4f0e8; }
  .card { width: 100%; max-width: 420px; border-radius: 24px; background: #16171a; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; }
  .bar { height: 6px; background: linear-gradient(90deg, #ffd21f, #ff6a00, #e4002b); }
  .body { padding: 24px; }
  .brand { display: flex; align-items: center; justify-content: space-between; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #8a8c96; }
  .brand strong { color: #f4f0e8; letter-spacing: 1px; }
  h1 { font-size: 18px; margin: 16px 0 4px; }
  .muted { color: #b6b8c2; font-size: 13px; margin: 0; }
  .amount { font-size: 34px; font-weight: 800; margin: 16px 0; }
  .row { display: flex; justify-content: space-between; font-size: 13px; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.08); }
  .row span:first-child { color: #8a8c96; }
  .actions { display: flex; gap: 10px; margin-top: 20px; }
  button { flex: 1; height: 48px; border-radius: 14px; border: none; font-size: 14px; font-weight: 700; cursor: pointer; }
  .pay { background: #e4002b; color: #fff; }
  .reject { background: transparent; color: #b6b8c2; border: 1px solid rgba(255,255,255,0.18); }
  .note { margin-top: 14px; font-size: 11px; color: #8a8c96; text-align: center; }
  .badge { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 10px; font-weight: 700;
    background: rgba(255,210,31,0.15); color: #ffd21f; text-transform: uppercase; letter-spacing: 1px; }
</style>
</head>
<body>
  <div class="card">
    <div class="bar"></div>
    <div class="body">
      <div class="brand"><strong>ePayco</strong><span class="badge">${mode === 'live' ? 'Live' : 'Pruebas'}</span></div>
      <h1>Pago seguro</h1>
      <p class="muted">Hola ${customer}, confirma tu pago del parche.</p>
      <div class="amount">${amount}</div>
      <div class="row"><span>Pedido</span><span>${order?.code ?? '—'}</span></div>
      <div class="row"><span>Referencia</span><span>${reference}</span></div>
      <div class="row"><span>Método</span><span>${payment.method}</span></div>
      <form class="actions" method="POST" action="/pay/epayco/confirm">
        <input type="hidden" name="ref" value="${reference}" />
        <button class="reject" type="submit" name="decision" value="reject">Rechazar</button>
        <button class="pay" type="submit" name="decision" value="approve">Pagar ${amount}</button>
      </form>
      <p class="note">Página de pruebas: no se cobra dinero real. Al confirmar se dispara el webhook con firma.</p>
    </div>
  </div>
</body>
</html>`
}
