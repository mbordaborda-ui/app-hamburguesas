/**
 * Facturación: dominio puro.
 *
 * `buildInvoice` convierte un pedido en una factura con su consecutivo y
 * `invoiceHtml` la renderiza como documento imprimible/descargable. El envío por
 * correo vive en `api.invoices` (backend real o simulado en modo local).
 *
 * Incluye los datos legales exigidos en Colombia para una factura de venta:
 * NIT y razón social del emisor, régimen tributario, dirección, resolución DIAN
 * de numeración, datos del adquirente, IVA / INC discriminados y la leyenda de
 * propina voluntaria (Ley 1935 de 2018). El CUFE es simulado: en producción lo
 * genera la DIAN al validar la factura electrónica.
 */

import { money } from '@/lib/format'
import { uid } from '@/lib/utils'
import type {
  CustomerDocType,
  Invoice,
  InvoiceCustomer,
  InvoiceIssuer,
  Order,
  Settings,
  TaxRegime,
} from '@/types'

export const INVOICE_STATUS_LABEL: Record<Invoice['status'], string> = {
  issued: 'Emitida',
  sent: 'Enviada',
  paid: 'Pagada',
  void: 'Anulada',
}

export const PAYMENT_LABEL: Record<string, string> = {
  card: 'Tarjeta débito/crédito',
  pse: 'PSE',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  cash: 'Efectivo contra entrega',
  bancolombia: 'Bancolombia',
  efecty: 'Efecty',
}

/** Régimen / responsabilidad tributaria del emisor. */
export const TAX_REGIME_LABEL: Record<TaxRegime, string> = {
  responsable_iva: 'Responsable de IVA',
  no_responsable: 'No responsable de IVA',
  simple: 'Régimen Simple de Tributación',
  gran_contribuyente: 'Gran contribuyente',
}

/** Tipo de documento del adquirente. */
export const DOC_TYPE_LABEL: Record<CustomerDocType, string> = {
  cc: 'C.C.',
  nit: 'NIT',
  ce: 'C.E.',
  pp: 'Pasaporte',
  final: 'Consumidor final',
}

export function invoiceNumber(sequence: number, prefix = 'EP-F'): string {
  return `${prefix}-${String(Math.max(1, sequence)).padStart(6, '0')}`
}

/** CUFE simulado (64 hex). En producción lo emite la DIAN; aquí es demostrativo. */
export function simulatedCufe(seed: string): string {
  let hash = 2166136261
  let out = ''
  for (let index = 0; index < 64; index++) {
    const code = seed.charCodeAt(index % seed.length) + index * 7
    hash = Math.imul(hash ^ code, 16777619) >>> 0
    out += ((hash >>> 28) & 0xf).toString(16)
  }
  return out
}

/** Construye el snapshot legal del emisor a partir de la configuración. */
export function issuerFromSettings(settings: Settings): InvoiceIssuer {
  const prefix = settings.invoicePrefix?.trim() || 'EP-F'
  const resolutionNumber = settings.resolutionNumber?.trim()
  const hasResolution =
    Boolean(resolutionNumber) &&
    typeof settings.resolutionFrom === 'number' &&
    typeof settings.resolutionTo === 'number'

  return {
    name: settings.legalName?.trim() || settings.storeName,
    nit: settings.nit?.trim() || undefined,
    taxRegime: settings.taxRegime,
    address: settings.legalAddress?.trim() || undefined,
    phone: settings.legalPhone?.trim() || settings.whatsapp,
    email: settings.legalEmail?.trim() || undefined,
    resolution: hasResolution
      ? {
          prefix,
          number: resolutionNumber!,
          date: settings.resolutionDate,
          from: settings.resolutionFrom!,
          to: settings.resolutionTo!,
        }
      : undefined,
  }
}

export function buildInvoice(params: {
  order: Order
  settings: Settings
  sequence: number
  customerName: string
  customerEmail: string
  customerDocType?: CustomerDocType
  customerDocNumber?: string
  customerAddress?: string
  customerPhone?: string
}): Invoice {
  const {
    order,
    settings,
    sequence,
    customerName,
    customerEmail,
    customerDocType,
    customerDocNumber,
    customerAddress,
    customerPhone,
  } = params
  const prefix = settings.invoicePrefix?.trim() || 'EP-F'
  // Impuestos incluidos en el subtotal: no alteran el total que ya pagó el cliente.
  const rate = settings.taxRate ?? 0
  const tax = rate > 0 ? Math.round(order.subtotal - order.subtotal / (1 + rate)) : 0
  const consumptionRate = settings.consumptionTaxRate ?? 0
  const consumptionTax =
    consumptionRate > 0 ? Math.round(order.subtotal - order.subtotal / (1 + consumptionRate)) : 0

  const issuer = issuerFromSettings(settings)
  const customer: InvoiceCustomer = {
    name: customerName,
    email: customerEmail,
    docType: customerDocType ?? 'final',
    docNumber: customerDocNumber?.trim() || undefined,
    address: customerAddress?.trim() || undefined,
    phone: customerPhone?.trim() || undefined,
  }

  return {
    id: uid('inv'),
    number: invoiceNumber(sequence, prefix),
    orderId: order.id,
    orderCode: order.code,
    userId: order.userId,
    customerName,
    customerEmail,
    issuedAt: new Date().toISOString(),
    status: 'issued',
    currency: 'COP',
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.unitPrice * item.quantity,
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    deliveryFee: order.deliveryFee,
    tip: order.tip,
    tax,
    taxRate: rate,
    consumptionTax,
    consumptionTaxRate: consumptionRate,
    total: order.total,
    paymentMethod: order.paymentMethodId,
    deliveryMode: order.deliveryMode,
    issuer,
    customer,
    cufe: simulatedCufe(`${prefix}-${sequence}-${order.id}-${order.total}`),
  }
}

export function invoiceFileName(invoice: Invoice): string {
  return `Factura-${invoice.number}-${invoice.orderCode}.html`
}

export function escapeHtml(value: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return value.replace(/[&<>"']/g, (char) => map[char] ?? char)
}

const text = (value?: string | number | null) => escapeHtml(String(value ?? ''))

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })

const formatShortDate = (value?: string) => {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}

const pct = (rate: number) => `${Math.round(rate * 100)}%`

/** Documento HTML autocontenido, listo para imprimir o descargar. */
export function invoiceHtml(invoice: Invoice, settings: Settings): string {
  const issuer = invoice.issuer ?? issuerFromSettings(settings)
  const customer: InvoiceCustomer = invoice.customer ?? {
    name: invoice.customerName,
    email: invoice.customerEmail,
  }

  const consumptionTax = invoice.consumptionTax ?? 0
  const base = invoice.subtotal - invoice.tax - consumptionTax
  const hasTax = invoice.tax > 0 || consumptionTax > 0
  const taxPct = invoice.taxRate ?? (invoice.tax > 0 ? invoice.tax / Math.max(1, base) : 0)
  const incPct = invoice.consumptionTaxRate ?? 0

  const rows = invoice.items
    .map(
      (item) => `
        <tr>
          <td>${text(item.name)}</td>
          <td class="num">${item.quantity}</td>
          <td class="num">${money(item.unitPrice)}</td>
          <td class="num">${money(item.total)}</td>
        </tr>`,
    )
    .join('')

  const taxLine =
    invoice.tax > 0
      ? `<tr><td>IVA${taxPct > 0 ? ` (${pct(taxPct)})` : ''}</td><td class="num">${money(invoice.tax)}</td></tr>`
      : ''
  const incLine =
    consumptionTax > 0
      ? `<tr><td>INC${incPct > 0 ? ` (${pct(incPct)})` : ''}</td><td class="num">${money(consumptionTax)}</td></tr>`
      : ''

  const resolution = issuer.resolution
  const regime = issuer.taxRegime ? TAX_REGIME_LABEL[issuer.taxRegime] : ''
  const docType = customer.docType ? DOC_TYPE_LABEL[customer.docType] : ''
  const delivery = invoice.deliveryMode === 'pickup' ? 'Recogida en el local' : 'Entrega a domicilio'

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Factura ${text(invoice.number)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: #111; margin: 0; padding: 32px; }
  .sheet { max-width: 760px; margin: 0 auto; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; border-bottom: 3px solid #e4002b; padding-bottom: 16px; }
  .brand { font-size: 26px; font-weight: 800; letter-spacing: 1px; margin: 0; }
  .muted { color: #666; font-size: 12px; margin: 2px 0; }
  .title { text-align: right; }
  .title h2 { margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 2px; }
  .title p { margin: 4px 0 0; font-size: 13px; }
  .title .res { font-size: 11px; }
  .cufe { margin: 12px 0 0; font-size: 10px; color: #888; word-break: break-all; }
  .grid { display: flex; justify-content: space-between; gap: 24px; margin: 20px 0; font-size: 13px; }
  .grid h3 { margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; }
  .grid > div { flex: 1; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 9px 8px; border-bottom: 1px solid #eee; }
  th { background: #f5f5f5; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; }
  .num { text-align: right; }
  .totals { margin-top: 16px; margin-left: auto; width: 300px; font-size: 13px; }
  .totals tr td { border: none; padding: 4px 8px; }
  .totals .total td { border-top: 2px solid #111; font-weight: 800; font-size: 16px; padding-top: 10px; }
  .note { margin-top: 10px; font-size: 11px; color: #777; }
  .foot { margin-top: 32px; border-top: 1px solid #eee; padding-top: 12px; font-size: 11px; color: #777; text-align: center; line-height: 1.6; }
</style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div>
        <h1 class="brand">${text(settings.storeName)}</h1>
        <p class="muted">${text(issuer.name)}</p>
        <p class="muted">NIT: ${text(issuer.nit || '—')}${regime ? ` · ${text(regime)}` : ''}</p>
        ${issuer.address ? `<p class="muted">${text(issuer.address)}</p>` : ''}
        <p class="muted">Tel. ${text(issuer.phone)}${issuer.email ? ` · ${text(issuer.email)}` : ''}</p>
      </div>
      <div class="title">
        <h2>Factura de venta</h2>
        <p><strong>${text(invoice.number)}</strong></p>
        <p class="muted">Pedido ${text(invoice.orderCode)}</p>
        ${
          resolution
            ? `<p class="muted res">Res. DIAN ${text(resolution.number)} del ${text(formatShortDate(resolution.date))}<br/>Prefijo ${text(resolution.prefix)} · del ${resolution.from} al ${resolution.to}</p>`
            : ''
        }
      </div>
    </div>

    ${invoice.cufe ? `<p class="cufe">CUFE: ${text(invoice.cufe)}</p>` : ''}

    <div class="grid">
      <div>
        <h3>Adquirente</h3>
        <div>${text(customer.name)}</div>
        <div class="muted">${text(docType)}${customer.docNumber ? `: ${text(customer.docNumber)}` : ''}</div>
        ${customer.address ? `<div class="muted">${text(customer.address)}</div>` : ''}
        ${customer.phone ? `<div class="muted">Tel. ${text(customer.phone)}</div>` : ''}
        <div class="muted">${text(customer.email)}</div>
      </div>
      <div>
        <h3>Emisión</h3>
        <div>${text(formatDate(invoice.issuedAt))}</div>
        <div class="muted">Pago: ${text(PAYMENT_LABEL[invoice.paymentMethod] ?? invoice.paymentMethod)}</div>
        <div class="muted">${text(delivery)}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr><th>Producto</th><th class="num">Cant.</th><th class="num">Precio</th><th class="num">Total</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <table class="totals">
      <tr><td>Subtotal${hasTax ? ' (base gravable)' : ''}</td><td class="num">${money(base)}</td></tr>
      ${invoice.discount > 0 ? `<tr><td>Descuento</td><td class="num">- ${money(invoice.discount)}</td></tr>` : ''}
      <tr><td>Domicilio</td><td class="num">${invoice.deliveryFee === 0 ? 'GRATIS' : money(invoice.deliveryFee)}</td></tr>
      ${invoice.tip > 0 ? `<tr><td>Propina voluntaria</td><td class="num">${money(invoice.tip)}</td></tr>` : ''}
      ${taxLine}
      ${incLine}
      <tr class="total"><td>Total</td><td class="num">${money(invoice.total)}</td></tr>
    </table>

    ${hasTax ? '<p class="note">Los impuestos están incluidos en el precio de venta.</p>' : ''}

    <p class="foot">
      ${text(settings.storeName)} · ${text(issuer.name)}${issuer.nit ? ` · NIT ${text(issuer.nit)}` : ''}<br/>
      La propina es voluntaria y no puede ser impuesta por el establecimiento (Ley 1935 de 2018).<br/>
      Documento generado electrónicamente. Gracias por tu pedido.
    </p>
  </div>
</body>
</html>`
}
