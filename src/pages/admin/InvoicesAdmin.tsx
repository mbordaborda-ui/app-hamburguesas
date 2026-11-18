import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Ban, CheckCircle2, Download, Eye, Mail, Receipt } from 'lucide-react'
import { AdminCard, DataTable, Kpi } from '@/components/admin/AdminBits'
import { Pill } from '@/components/ui/Badge'
import { IconButton } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Input'
import { downloadFile } from '@/lib/download'
import { money } from '@/lib/format'
import { INVOICE_STATUS_LABEL, invoiceFileName, invoiceHtml } from '@/lib/invoice'
import { cn } from '@/lib/utils'
import { api } from '@/services/api'
import { useDb } from '@/store/db'
import { toast } from '@/store/ui'
import type { Invoice, InvoiceStatus } from '@/types'

type Filter = 'all' | InvoiceStatus

const toneFor = (status: InvoiceStatus) =>
  status === 'paid' ? 'lime' : status === 'void' ? 'flame' : status === 'sent' ? 'volt' : 'neutral'

export default function InvoicesAdmin() {
  const invoices = useDb((s) => s.invoices)
  const settings = useDb((s) => s.settings)
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = useMemo(
    () => (filter === 'all' ? invoices : invoices.filter((invoice) => invoice.status === filter)),
    [invoices, filter],
  )

  const totals = useMemo(
    () => ({
      billed: invoices
        .filter((invoice) => invoice.status !== 'void')
        .reduce((acc, invoice) => acc + invoice.total, 0),
      sent: invoices.filter((invoice) => invoice.status === 'sent').length,
      paid: invoices.filter((invoice) => invoice.status === 'paid').length,
      issued: invoices.filter((invoice) => invoice.status === 'issued').length,
    }),
    [invoices],
  )

  const send = async (invoice: Invoice) => {
    const sent = await api.invoices.send(invoice.id)
    toast({
      title: sent ? `Factura ${invoice.number} enviada` : 'No pudimos enviarla',
      description: sent ? `A ${invoice.customerEmail}` : undefined,
      emoji: sent ? '📧' : '⚠️',
      tone: sent ? 'success' : 'error',
    })
  }

  const setStatus = async (invoice: Invoice, status: InvoiceStatus) => {
    await api.invoices.setStatus(invoice.id, status)
    toast({ title: `Factura ${invoice.number}: ${INVOICE_STATUS_LABEL[status]}`, emoji: '🧾' })
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Facturado" value={money(totals.billed)} tone="lime" icon={<Receipt className="size-4" />} />
        <Kpi label="Emitidas" value={String(totals.issued)} tone="volt" />
        <Kpi label="Enviadas" value={String(totals.sent)} tone="flame" />
        <Kpi label="Pagadas" value={String(totals.paid)} tone="lime" />
      </div>

      <AdminCard
        title="Facturas"
        subtitle={`${invoices.length} documentos · ${filtered.length} en vista`}
        action={
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'Todas' },
              { value: 'issued', label: 'Emitidas' },
              { value: 'sent', label: 'Enviadas' },
              { value: 'paid', label: 'Pagadas' },
              { value: 'void', label: 'Anuladas' },
            ]}
          />
        }
      >
        {invoices.length === 0 ? (
          <p className="py-8 text-center text-sm text-ash">
            Todavía no hay facturas. Se emiten al crear cada pedido.
          </p>
        ) : (
          <DataTable headers={['Factura', 'Pedido', 'Cliente', 'Total', 'Estado', 'Acciones']}>
            {filtered.map((invoice) => (
              <tr key={invoice.id} className="border-b border-white/[0.06]">
                <td className="whitespace-nowrap px-3 py-3">
                  <span className="font-display text-sm text-bone">{invoice.number}</span>
                  <span className="block text-[10px] text-concrete">
                    {new Date(invoice.issuedAt).toLocaleDateString('es-CO')}
                  </span>
                </td>
                <td className="px-3 py-3 text-xs text-ash">{invoice.orderCode}</td>
                <td className="px-3 py-3">
                  <span className="block text-xs font-semibold text-bone">
                    {invoice.customerName}
                  </span>
                  <span className="block text-[10px] text-concrete">{invoice.customerEmail}</span>
                </td>
                <td className="whitespace-nowrap px-3 py-3 font-display text-sm text-red">
                  {money(invoice.total)}
                </td>
                <td className="px-3 py-3">
                  <Pill tone={toneFor(invoice.status)}>{INVOICE_STATUS_LABEL[invoice.status]}</Pill>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1.5">
                    <Link to={`/invoice/${invoice.orderId}`} aria-label="Ver factura">
                      <IconButton label="Ver factura" className="size-8">
                        <Eye className="size-3.5" />
                      </IconButton>
                    </Link>
                    <IconButton
                      label="Descargar"
                      className="size-8"
                      onClick={() => downloadFile(invoiceFileName(invoice), invoiceHtml(invoice, settings))}
                    >
                      <Download className="size-3.5" />
                    </IconButton>
                    <IconButton
                      label="Enviar por correo"
                      className="size-8"
                      disabled={invoice.status === 'void'}
                      onClick={() => send(invoice)}
                    >
                      <Mail className="size-3.5" />
                    </IconButton>
                    <IconButton
                      label="Marcar pagada"
                      className={cn('size-8', invoice.status === 'paid' && 'text-lime')}
                      disabled={invoice.status === 'paid' || invoice.status === 'void'}
                      onClick={() => setStatus(invoice, 'paid')}
                    >
                      <CheckCircle2 className="size-3.5" />
                    </IconButton>
                    <IconButton
                      label="Anular"
                      className="size-8"
                      disabled={invoice.status === 'void'}
                      onClick={() => setStatus(invoice, 'void')}
                    >
                      <Ban className="size-3.5" />
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </AdminCard>

      <AdminCard title="Facturación automática" subtitle="Cómo se emiten los documentos">
        <p className="text-xs leading-relaxed text-ash">
          Cada pedido genera su factura con consecutivo <strong className="text-bone">EP-F-000000</strong>.
          El botón <strong className="text-bone">Enviar</strong> la manda al correo del cliente: en
          modo remoto el backend hace el envío real (SMTP/servicio); en modo local se simula y queda
          registrada como enviada. También puedes descargarla o imprimirla en PDF desde su página.
        </p>
      </AdminCard>
    </div>
  )
}
