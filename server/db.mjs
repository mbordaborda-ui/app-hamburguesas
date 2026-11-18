/**
 * Base de datos SQLite usando el módulo integrado `node:sqlite` (Node 22.5+).
 * Cero dependencias. El archivo vive en `server/data/` (ignorado por git).
 */

import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const DB_PATH =
  process.env.DB_PATH ?? fileURLToPath(new URL('./data/parche.sqlite', import.meta.url))

mkdirSync(dirname(DB_PATH), { recursive: true })

export const db = new DatabaseSync(DB_PATH)

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'COP',
    status TEXT NOT NULL DEFAULT 'pending',
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS payments (
    reference TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    method TEXT NOT NULL,
    provider TEXT NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'COP',
    status TEXT NOT NULL DEFAULT 'pending',
    idempotency_key TEXT,
    provider_ref TEXT,
    failure_reason TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_idempotency
    ON payments(idempotency_key) WHERE idempotency_key IS NOT NULL;

  CREATE TABLE IF NOT EXISTS webhook_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reference TEXT,
    payload TEXT NOT NULL,
    signature_ok INTEGER NOT NULL,
    received_at TEXT NOT NULL
  );
`)

const now = () => new Date().toISOString()

export function upsertOrder(order) {
  db.prepare(
    `INSERT INTO orders
       (id, code, amount, currency, status, customer_name, customer_email, customer_phone, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       code = excluded.code,
       amount = excluded.amount,
       customer_name = excluded.customer_name,
       customer_email = excluded.customer_email,
       customer_phone = excluded.customer_phone,
       updated_at = excluded.updated_at`,
  ).run(
    order.id,
    order.code,
    order.amount,
    order.currency ?? 'COP',
    order.status ?? 'pending',
    order.customerName ?? null,
    order.customerEmail ?? null,
    order.customerPhone ?? null,
    now(),
    now(),
  )
  return getOrder(order.id)
}

export function getOrder(id) {
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
}

export function listOrders() {
  return db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all()
}

export function setOrderStatus(id, status) {
  db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(status, now(), id)
  return getOrder(id)
}

export function insertPayment(payment) {
  db.prepare(
    `INSERT INTO payments
       (reference, order_id, method, provider, amount, currency, status, idempotency_key, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    payment.reference,
    payment.orderId,
    payment.method,
    payment.provider,
    payment.amount,
    payment.currency ?? 'COP',
    payment.status ?? 'pending',
    payment.idempotencyKey ?? null,
    now(),
    now(),
  )
  return getPayment(payment.reference)
}

export function getPayment(reference) {
  return db.prepare('SELECT * FROM payments WHERE reference = ?').get(reference)
}

export function getPaymentByIdempotency(key) {
  return db.prepare('SELECT * FROM payments WHERE idempotency_key = ?').get(key)
}

export function listPayments() {
  return db.prepare('SELECT * FROM payments ORDER BY created_at DESC').all()
}

export function setPaymentStatus(reference, status, reason) {
  db.prepare(
    'UPDATE payments SET status = ?, failure_reason = ?, updated_at = ? WHERE reference = ?',
  ).run(status, reason ?? null, now(), reference)
  return getPayment(reference)
}

export function insertWebhookEvent(reference, payload, signatureOk) {
  db.prepare(
    'INSERT INTO webhook_events (reference, payload, signature_ok, received_at) VALUES (?, ?, ?, ?)',
  ).run(reference ?? null, JSON.stringify(payload), signatureOk ? 1 : 0, now())
}
