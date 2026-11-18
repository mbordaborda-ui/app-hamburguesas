import { ShieldCheck } from 'lucide-react'
import { AdminCard, DataTable, Kpi } from '@/components/admin/AdminBits'
import { paymentStatusLabel, paymentStatusTone } from '@/services/payments'
import { clockLabel, dateLabel, money } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDb } from '@/store/db'
import { toast } from '@/store/ui'

export default function PaymentsAdmin() {
  const payments = useDb((s) => s.payments)
  const orders = useDb((s) => s.orders)
  const methods = useDb((s) => s.settings.paymentMethods)
  const updatePaymentMethod = useDb((s) => s.updatePaymentMethod)

  const orderCode = (orderId: string) =>
    orders.find((o) => o.id === orderId)?.code ?? orderId.slice(0, 10)

  const approved = payments.filter((p) => p.status === 'approved')
  const pending = payments.filter((p) => p.status === 'pending' || p.status === 'processing')
  const total = approved.reduce((a, p) => a + p.amount, 0)

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Recaudado" value={money(total)} hint={`${approved.length} pagos aprobados`} />
        <Kpi label="Pendientes" value={String(pending.length)} hint="Por confirmar" tone="flame" />
        <Kpi
          label="Métodos activos"
          value={`${methods.filter((m) => m.enabled).length}/${methods.length}`}
          hint="Disponibles en checkout"
          tone="yellow"
        />
      </div>

      <AdminCard title="Métodos de pago" subtitle="Activa o desactiva métodos desde aquí">
        <div className="grid gap-2 sm:grid-cols-2">
          {methods.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => {
                updatePaymentMethod(method.id, { enabled: !method.enabled })
                toast({
                  title: method.enabled ? 'Método desactivado' : 'Método activado',
                  description: method.label,
                  emoji: method.emoji,
                  tone: method.enabled ? 'default' : 'success',
                })
              }}
              className={cn(
                'flex items-center gap-3 rounded-2xl border p-3.5 text-left transition',
                method.enabled
                  ? 'border-red/40 bg-red/[0.06]'
                  : 'border-white/[0.07] bg-white/[0.02] opacity-60',
              )}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-lg">
                {method.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-bone">{method.label}</span>
                <span className="block text-[10px] text-ash">
                  {method.provider === 'epayco' ? 'ePayco' : method.provider}
                  {method.requiresBackend ? ' · requiere backend' : ' · sin backend'}
                </span>
              </span>
              <span
                className={cn(
                  'size-2.5 shrink-0 rounded-full',
                  method.enabled ? 'bg-lime' : 'bg-concrete',
                )}
              />
            </button>
          ))}
        </div>
      </AdminCard>

      <AdminCard
        title="Transacciones"
        subtitle="Historial de pagos generados por los pedidos"
        padded={false}
      >
        {payments.length === 0 ? (
          <p className="px-4 py-10 text-center text-xs text-concrete">
            Aún no hay transacciones registradas.
          </p>
        ) : (
          <div className="p-4">
            <DataTable headers={['Referencia', 'Pedido', 'Método', 'Monto', 'Estado', 'Fecha']}>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-white/[0.05] last:border-0">
                  <td className="px-3 py-2.5">
                    <p className="font-mono text-[11px] text-bone">{payment.providerRef}</p>
                    <p className="text-[10px] text-concrete">{payment.provider}</p>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-ash">{orderCode(payment.orderId)}</td>
                  <td className="px-3 py-2.5 text-xs text-ash">
                    {methods.find((m) => m.id === payment.method)?.label ?? payment.method}
                  </td>
                  <td className="px-3 py-2.5 text-xs font-bold text-red">{money(payment.amount)}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                        paymentStatusTone[payment.status],
                      )}
                    >
                      {paymentStatusLabel[payment.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[10px] text-concrete">
                    {dateLabel(payment.createdAt)} · {clockLabel(payment.createdAt)}
                  </td>
                </tr>
              ))}
            </DataTable>
          </div>
        )}
      </AdminCard>

      <AdminCard title="Seguridad" subtitle="Arquitectura de pagos">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-yellow" />
          <ul className="space-y-2 text-xs text-ash">
            <li>· Las llaves privadas de ePayco (P_KEY, P_CUST_ID_CLIENTE) viven solo en el backend.</li>
            <li>· El frontend únicamente recibe la llave pública y la URL de checkout.</li>
            <li>· Cada pago usa <code className="text-red">idempotencyKey</code> para evitar cobros duplicados.</li>
            <li>· Estados soportados: pendiente, procesando, aprobado, rechazado, cancelado, reembolsado.</li>
            <li>· Los webhooks de ePayco se validan por firma antes de actualizar el pedido.</li>
          </ul>
        </div>
      </AdminCard>
    </div>
  )
}
