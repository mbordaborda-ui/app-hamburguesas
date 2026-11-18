import { AdminCard, Bar, Kpi } from '@/components/admin/AdminBits'
import { money, number } from '@/lib/format'
import { useDb } from '@/store/db'

export default function Stats() {
  const orders = useDb((s) => s.orders)
  const products = useDb((s) => s.products)
  const categories = useDb((s) => s.categories)
  const users = useDb((s) => s.users)

  const valid = orders.filter((o) => o.status !== 'cancelled')
  const revenue = valid.reduce((a, o) => a + o.total, 0)
  const avgTicket = valid.length ? revenue / valid.length : 0

  // Últimos 7 días
  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    const key = date.toISOString().slice(0, 10)
    const dayOrders = valid.filter((o) => o.createdAt.slice(0, 10) === key)
    return {
      label: date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }),
      orders: dayOrders.length,
      revenue: dayOrders.reduce((a, o) => a + o.total, 0),
    }
  })
  const maxOrders = Math.max(...days.map((d) => d.orders), 1)
  const maxRevenue = Math.max(...days.map((d) => d.revenue), 1)

  const productSales = products
    .map((product) => {
      const items = valid.flatMap((o) => o.items).filter((i) => i.productId === product.id)
      return {
        product,
        units: items.reduce((a, i) => a + i.quantity, 0),
        revenue: items.reduce((a, i) => a + i.unitPrice * i.quantity, 0),
      }
    })
    .sort((a, b) => b.units - a.units)

  const maxUnits = productSales[0]?.units ?? 1

  const categoryShare = categories
    .map((category) => {
      const items = valid
        .flatMap((o) => o.items)
        .filter((i) => products.find((p) => p.id === i.productId)?.categoryId === category.id)
      return {
        category,
        units: items.reduce((a, i) => a + i.quantity, 0),
      }
    })
    .filter((entry) => entry.units > 0)
    .sort((a, b) => b.units - a.units)

  const customersWithOrders = new Set(valid.map((o) => o.userId).filter(Boolean))
  const repeatCustomers = [...customersWithOrders].filter(
    (id) => valid.filter((o) => o.userId === id).length > 1,
  ).length
  const repeatRate = customersWithOrders.size
    ? Math.round((repeatCustomers / customersWithOrders.size) * 100)
    : 0

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Ventas totales" value={money(revenue)} hint={`${valid.length} pedidos`} />
        <Kpi label="Ticket promedio" value={money(avgTicket)} tone="lime" />
        <Kpi label="Tasa de recompra" value={`${repeatRate}%`} hint="Clientes que vuelven" tone="yellow" />
        <Kpi label="Clientes" value={number(users.length)} hint={`${customersWithOrders.size} con pedidos`} tone="grape" />
      </div>

      <AdminCard title="Últimos 7 días" subtitle="Pedidos y ventas por día">
        {valid.length === 0 ? (
          <p className="py-8 text-center text-xs text-concrete">
            Sin datos todavía. Las estadísticas se llenan con los pedidos reales.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-concrete">
                Pedidos por día
              </p>
              <div className="flex items-end gap-2">
                {days.map((day) => (
                  <div key={day.label} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="flex h-32 w-full items-end justify-center">
                      <div
                        className="w-full max-w-10 rounded-t-lg bg-red transition-[height] duration-700"
                        style={{ height: `${Math.max(4, (day.orders / maxOrders) * 100)}%` }}
                        title={`${day.orders} pedidos`}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-bone">{day.orders}</span>
                    <span className="text-[9px] uppercase text-concrete">{day.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 border-t border-white/[0.06] pt-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-concrete">
                Ingresos por día
              </p>
              {days.map((day) => (
                <Bar
                  key={day.label}
                  label={day.label}
                  value={day.revenue}
                  max={maxRevenue}
                  tone="yellow"
                />
              ))}
            </div>
          </div>
        )}
      </AdminCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <AdminCard title="Productos más vendidos" subtitle="Unidades">
          {productSales.every((p) => p.units === 0) ? (
            <p className="py-6 text-center text-xs text-concrete">Sin ventas registradas.</p>
          ) : (
            <div className="space-y-3">
              {productSales.slice(0, 8).map((entry, index) => (
                <Bar
                  key={entry.product.id}
                  label={`${index + 1}. ${entry.product.name} · ${money(entry.revenue)}`}
                  value={entry.units}
                  max={maxUnits}
                  tone={index < 3 ? 'volt' : 'lime'}
                />
              ))}
            </div>
          )}
        </AdminCard>

        <AdminCard title="Ventas por categoría" subtitle="Unidades">
          {categoryShare.length === 0 ? (
            <p className="py-6 text-center text-xs text-concrete">Sin datos por categoría.</p>
          ) : (
            <div className="space-y-3">
              {categoryShare.map((entry) => (
                <Bar
                  key={entry.category.id}
                  label={`${entry.category.emoji} ${entry.category.name}`}
                  value={entry.units}
                  max={categoryShare[0].units}
                  tone="flame"
                />
              ))}
            </div>
          )}
        </AdminCard>
      </div>

      <AdminCard title="Métricas clave" subtitle="Indicadores del negocio">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Clientes nuevos" value={String(users.length)} hint="Registros totales" />
          <Metric label="Clientes recurrentes" value={String(repeatCustomers)} hint="2+ pedidos" />
          <Metric
            label="Productos activos"
            value={String(products.filter((p) => p.isAvailable).length)}
            hint={`${products.length} en catálogo`}
          />
          <Metric
            label="Unidades vendidas"
            value={number(productSales.reduce((a, p) => a + p.units, 0))}
            hint="Todas las categorías"
          />
        </div>
      </AdminCard>
    </div>
  )
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-concrete">{label}</p>
      <p className="mt-1 font-display text-xl text-bone">{value}</p>
      <p className="text-[10px] text-ash">{hint}</p>
    </div>
  )
}
