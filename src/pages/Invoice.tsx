import { useEffect, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Download, Mail, Printer, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Feedback'
import { downloadFile } from '@/lib/download'
import { money } from '@/lib/format'
import {
  DOC_TYPE_LABEL,
  INVOICE_STATUS_LABEL,
  PAYMENT_LABEL,
  TAX_REGIME_LABEL,
  buildInvoice,
  invoiceFileName,
  invoiceHtml,
  issuerFromSettings,
} from '@/lib/invoice'
import { cn } from '@/lib/utils'
import { api } from '@/services/api'
import { useAuth } from '@/store/auth'
import { useDb } from '@/store/db'
import { toast } from '@/store/ui'

export default function InvoicePage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const order = useDb((s) => s.orders.find((o) => o.id === orderId))
  const invoices = useDb((s) => s.invoices)
  const users = useDb((s) => s.users)
  const settings = useDb((s) => s.settings)
  const addInvoice = useDb((s) => s.addInvoice)
  const user = useAuth((s) => s.user)

  const existing = invoices.find((invoice) => invoice.orderId === orderId)
  const created = useRef(false)

  // Pedidos viejos (antes de facturación) generan su factura al abrirla.
  useEffect(() => {
    if (!order || existing || created.current) return
    created.current = true
    const owner = order.userId ? users.find((u) => u.id === order.userId) : undefined
    addInvoice(
      buildInvoice({
        order,
        settings,
        sequence: useDb.getState().invoices.length + 1,
        customerName: owner?.name ?? user?.name ?? 'Cliente invitado',
        customerEmail: owner?.email ?? user?.email ?? 'invitado@elparche.co',
        customerAddress: [order.address?.line, order.address?.details, order.address?.city]
          .filter(Boolean)
          .join(', '),
        customerPhone: owner?.phone ?? user?.phone,
      }),
    )
  }, [order, existing, users, settings, user, addInvoice])

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          emoji="🧾"
          title="Factura no encontrada"
          description="No encontramos el pedido de esta factura."
          action={<Button onClick={() => navigate('/orders')}>Ver mis pedidos</Button>}
        />
      </div>
    )
  }

  if (!existing) {
    return <p className="py-16 text-center text-sm text-ash">Generando factura…</p>
  }

  const invoice = existing

  const issuer = invoice.issuer ?? issuerFromSettings(settings)
  const customer = invoice.customer ?? {
    name: invoice.customerName,
    email: invoice.customerEmail,
  }
  const consumptionTax = invoice.consumptionTax ?? 0
  const base = invoice.subtotal - invoice.tax - consumptionTax
  const hasTax = invoice.tax > 0 || consumptionTax > 0
  const taxPct = invoice.taxRate ?? (invoice.tax > 0 ? invoice.tax / Math.max(1, base) : 0)
  const incPct = invoice.consumptionTaxRate ?? 0

  const send = async () => {
    const sent = await api.invoices.send(invoice.id)
    toast({
      title: sent ? `Factura enviada a ${invoice.customerEmail}` : 'No pudimos enviarla',
      emoji: sent ? '📧' : '⚠️',
      tone: sent ? 'success' : 'error',
    })
  }

  const download = () => {
    downloadFile(invoiceFileName(invoice), invoiceHtml(invoice, settings))
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="print:hidden mb-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ash transition hover:text-red"
      >
        <ArrowLeft className="size-3.5" /> Volver
      </button>

      {/* Acciones */}
      <div className="print:hidden mb-4 flex flex-wrap gap-2">
        <Button icon={<Printer className="size-4" />} onClick={() => window.print()}>
          Imprimir / PDF
        </Button>
        <Button variant="outline" icon={<Download className="size-4" />} onClick={download}>
          Descargar
        </Button>
        <Button
          variant="outline"
          icon={<Mail className="size-4" />}
          onClick={send}
          disabled={invoice.status === 'sent' || invoice.status === 'paid'}
        >
          {invoice.status === 'sent' ? 'Factura enviada' : 'Enviar a mi correo'}
        </Button>
        {invoice.status === 'sent' && (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-lime">
            <CheckCircle2 className="size-4" /> Enviada
          </span>
        )}
      </div>

      {/* Documento */}
      <article className="overflow-hidden rounded-[24px] bg-white p-6 text-ink shadow-pop sm:p-10 print:rounded-none print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-red pb-4">
          <div>
            <h1 className="font-display text-3xl leading-none text-ink">{settings.storeName}</h1>
            <p className="mt-1 text-xs font-semibold text-neutral-700">{issuer.name}</p>
            <p className="text-xs text-neutral-500">
              NIT: {issuer.nit || '—'}
              {issuer.taxRegime ? ` · ${TAX_REGIME_LABEL[issuer.taxRegime]}` : ''}
            </p>
            {issuer.address && <p className="text-xs text-neutral-500">{issuer.address}</p>}
            <p className="text-xs text-neutral-500">
              Tel. {issuer.phone}
              {issuer.email ? ` · ${issuer.email}` : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-sm uppercase tracking-[0.2em] text-red">
              Factura de venta
            </p>
            <p className="mt-1 font-display text-xl text-ink">{invoice.number}</p>
            <p className="text-xs text-neutral-500">Pedido {invoice.orderCode}</p>
            {issuer.resolution && (
              <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">
                Res. DIAN {issuer.resolution.number} del {formatShortDate(issuer.resolution.date)}
                <br />
                Prefijo {issuer.resolution.prefix} · del {issuer.resolution.from} al{' '}
                {issuer.resolution.to}
              </p>
            )}
          </div>
        </header>

        {invoice.cufe && (
          <p className="mt-3 break-all text-[10px] text-neutral-400">CUFE: {invoice.cufe}</p>
        )}

        <div className="mt-5 flex flex-wrap justify-between gap-4 text-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Adquirente
            </p>
            <p className="font-semibold text-ink">{customer.name}</p>
            <p className="text-xs text-neutral-500">
              {customer.docType ? DOC_TYPE_LABEL[customer.docType] : 'Consumidor final'}
              {customer.docNumber ? `: ${customer.docNumber}` : ''}
            </p>
            {customer.address && <p className="text-xs text-neutral-500">{customer.address}</p>}
            {customer.phone && <p className="text-xs text-neutral-500">Tel. {customer.phone}</p>}
            <p className="text-xs text-neutral-500">{customer.email}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Emisión
            </p>
            <p className="text-xs text-neutral-600">
              {new Date(invoice.issuedAt).toLocaleString('es-CO', {
                dateStyle: 'long',
                timeStyle: 'short',
              })}
            </p>
            <p className="text-xs text-neutral-500">
              Pago: {PAYMENT_LABEL[invoice.paymentMethod] ?? invoice.paymentMethod}
            </p>
            <p className="text-xs text-neutral-500">
              {invoice.deliveryMode === 'pickup' ? 'Recogida en el local' : 'Entrega a domicilio'}
            </p>
          </div>
        </div>

        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Producto
              </th>
              <th className="px-2 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Cant.
              </th>
              <th className="px-2 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Precio
              </th>
              <th className="px-2 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index} className="border-b border-neutral-100">
                <td className="px-2 py-2 text-ink">{item.name}</td>
                <td className="px-2 py-2 text-right text-neutral-600">{item.quantity}</td>
                <td className="px-2 py-2 text-right text-neutral-600">{money(item.unitPrice)}</td>
                <td className="px-2 py-2 text-right font-semibold text-ink">{money(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto mt-4 w-full max-w-xs space-y-1 text-sm">
          <Line label={hasTax ? 'Subtotal (base gravable)' : 'Subtotal'} value={money(base)} />
          {invoice.discount > 0 && <Line label="Descuento" value={`- ${money(invoice.discount)}`} />}
          <Line
            label="Domicilio"
            value={invoice.deliveryFee === 0 ? 'GRATIS' : money(invoice.deliveryFee)}
          />
          {invoice.tip > 0 && <Line label="Propina voluntaria" value={money(invoice.tip)} />}
          {invoice.tax > 0 && (
            <Line
              label={`IVA${taxPct > 0 ? ` (${Math.round(taxPct * 100)}%)` : ''}`}
              value={money(invoice.tax)}
            />
          )}
          {consumptionTax > 0 && (
            <Line
              label={`INC${incPct > 0 ? ` (${Math.round(incPct * 100)}%)` : ''}`}
              value={money(consumptionTax)}
            />
          )}
          <div className="flex items-center justify-between border-t-2 border-ink pt-2">
            <span className="font-display text-base uppercase text-ink">Total</span>
            <span className="font-display text-2xl text-red">{money(invoice.total)}</span>
          </div>
        </div>

        {hasTax && (
          <p className="mt-2 text-right text-[10px] text-neutral-400">
            Los impuestos están incluidos en el precio de venta.
          </p>
        )}

        <p className="mt-8 border-t border-neutral-100 pt-3 text-center text-[11px] leading-relaxed text-neutral-400">
          {settings.storeName} · {issuer.name}
          {issuer.nit ? ` · NIT ${issuer.nit}` : ''}
          <br />
          La propina es voluntaria y no puede ser impuesta por el establecimiento (Ley 1935 de
          2018).
          <br />
          Documento generado electrónicamente. Gracias por tu pedido.
        </p>
      </article>

      <div className="print:hidden mt-4 flex flex-wrap items-center justify-between gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider',
            invoice.status === 'paid'
              ? 'bg-lime/15 text-lime'
              : invoice.status === 'void'
                ? 'bg-flame/15 text-flame'
                : 'bg-white/10 text-ash',
          )}
        >
          <Receipt className="size-3.5" /> {INVOICE_STATUS_LABEL[invoice.status]}
        </span>
        <Link
          to={`/tracking/${order.id}`}
          className="text-xs font-bold uppercase tracking-wider text-red hover:underline"
        >
          Ver seguimiento
        </Link>
      </div>
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-neutral-600">
      <span>{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  )
}

function formatShortDate(value?: string) {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}
