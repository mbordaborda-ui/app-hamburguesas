import { describe, expect, it } from 'vitest'
import { buildInvoice, escapeHtml, invoiceHtml, invoiceNumber } from '@/lib/invoice'
import type { Order, Settings } from '@/types'

const settings = {
  storeName: 'EL PARCHE',
  tagline: 'Hamburguesas urbanas',
  whatsapp: '+57 300 000 0000',
  taxRate: 0,
} as Settings

const order = {
  id: 'o1',
  code: 'EP-1234',
  userId: 'u1',
  createdAt: '2026-09-21T20:00:00Z',
  status: 'confirmed',
  items: [
    {
      id: 'i1',
      productId: 'p1',
      name: 'LA CALLEJERA',
      image: '',
      unitPrice: 25000,
      quantity: 2,
      selections: [],
    },
  ],
  subtotal: 50000,
  discount: 0,
  deliveryFee: 6900,
  tip: 2000,
  total: 58900,
  paymentMethodId: 'card',
  deliveryMode: 'delivery',
} as unknown as Order

const build = (override: Partial<Settings> = {}) =>
  buildInvoice({
    order,
    settings: { ...settings, ...override },
    sequence: 1,
    customerName: 'Miguel Ángel',
    customerEmail: 'miguel@elparche.co',
  })

describe('invoiceNumber', () => {
  it('usa consecutivo de 6 dígitos', () => {
    expect(invoiceNumber(42)).toBe('EP-F-000042')
    expect(invoiceNumber(0)).toBe('EP-F-000001')
  })
})

describe('buildInvoice', () => {
  it('copia items y totales del pedido', () => {
    const invoice = build()
    expect(invoice.number).toBe('EP-F-000001')
    expect(invoice.status).toBe('issued')
    expect(invoice.customerEmail).toBe('miguel@elparche.co')
    expect(invoice.items[0]).toMatchObject({ name: 'LA CALLEJERA', quantity: 2, total: 50000 })
    expect(invoice.total).toBe(58900)
    expect(invoice.tax).toBe(0)
  })

  it('calcula el IVA incluido sin cambiar el total', () => {
    const invoice = build({ taxRate: 0.19 })
    expect(invoice.tax).toBeGreaterThan(0)
    expect(invoice.total).toBe(58900)
  })
})

describe('invoiceHtml', () => {
  it('incluye número, cliente y productos', () => {
    const html = invoiceHtml(build(), settings)
    expect(html).toContain('EP-F-000001')
    expect(html).toContain('Miguel Ángel')
    expect(html).toContain('LA CALLEJERA')
  })
})

describe('escapeHtml', () => {
  it('neutraliza etiquetas', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
  })
})

describe('datos legales (Colombia)', () => {
  const legal: Partial<Settings> = {
    legalName: 'EL PARCHE S.A.S.',
    nit: '901.234.567-8',
    taxRegime: 'responsable_iva',
    legalAddress: 'Cra. 45 # 12-34 · Bogotá D.C.',
    legalEmail: 'facturacion@elparche.co',
    invoicePrefix: 'EP-F',
    resolutionNumber: '18764001234567',
    resolutionDate: '2026-01-15',
    resolutionFrom: 1,
    resolutionTo: 5000,
    consumptionTaxRate: 0.08,
  }

  it('guarda el snapshot del emisor con NIT, régimen y resolución', () => {
    const invoice = build(legal)
    expect(invoice.issuer).toMatchObject({
      name: 'EL PARCHE S.A.S.',
      nit: '901.234.567-8',
      taxRegime: 'responsable_iva',
      resolution: { prefix: 'EP-F', number: '18764001234567', from: 1, to: 5000 },
    })
    expect(invoice.customer).toMatchObject({ docType: 'final' })
    expect(invoice.cufe).toHaveLength(64)
  })

  it('calcula el INC incluido sin cambiar el total', () => {
    const invoice = build(legal)
    expect(invoice.consumptionTax).toBeGreaterThan(0)
    expect(invoice.total).toBe(58900)
  })

  it('imprime NIT, resolución, CUFE y leyenda de propina', () => {
    const html = invoiceHtml(build(legal), { ...settings, ...legal })
    expect(html).toContain('NIT: 901.234.567-8')
    expect(html).toContain('Responsable de IVA')
    expect(html).toContain('Res. DIAN 18764001234567')
    expect(html).toContain('CUFE:')
    expect(html).toContain('INC (8%)')
    expect(html).toContain('Ley 1935 de 2018')
  })
})
