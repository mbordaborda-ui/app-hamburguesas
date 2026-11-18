import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { AdminCard, DataTable } from '@/components/admin/AdminBits'
import { Button, IconButton } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Badge'
import { Input, Segmented, Switch } from '@/components/ui/Input'
import { Sheet } from '@/components/ui/Sheet'
import { countdown, money } from '@/lib/format'
import { uid } from '@/lib/utils'
import { useDb } from '@/store/db'
import { toast } from '@/store/ui'
import type { Coupon, CouponType } from '@/types'

const emptyCoupon = (): Coupon => ({
  id: uid('c'),
  code: '',
  description: '',
  type: 'percent',
  value: 10,
  minSubtotal: 30000,
  expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
  conditions: 'Válido por 30 días.',
  active: true,
  usedCount: 0,
  emoji: '🎟️',
})

export default function Promos() {
  const coupons = useDb((s) => s.coupons)
  const upsertCoupon = useDb((s) => s.upsertCoupon)
  const deleteCoupon = useDb((s) => s.deleteCoupon)

  const [form, setForm] = useState<Coupon | null>(null)
  const [isNew, setIsNew] = useState(false)

  const save = () => {
    if (!form || !form.code.trim()) return
    upsertCoupon({ ...form, code: form.code.trim().toUpperCase() })
    toast({ title: isNew ? 'Cupón creado' : 'Cupón actualizado', description: form.code.toUpperCase(), emoji: form.emoji, tone: 'success' })
    setForm(null)
  }

  return (
    <div className="space-y-5">
      <AdminCard
        title="Cupones y campañas"
        subtitle={`${coupons.filter((c) => c.active).length} activos de ${coupons.length}`}
        action={
          <Button
            size="sm"
            icon={<Plus className="size-4" />}
            onClick={() => {
              setIsNew(true)
              setForm(emptyCoupon())
            }}
          >
            Nuevo cupón
          </Button>
        }
      >
        <DataTable headers={['Código', 'Tipo', 'Valor', 'Mínimo', 'Usos', 'Vence', 'Estado', '']}>
          {coupons.map((coupon) => (
            <tr key={coupon.id} className="border-b border-white/[0.05] last:border-0">
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span>{coupon.emoji}</span>
                  <div>
                    <p className="text-xs font-bold tracking-wide text-bone">{coupon.code}</p>
                    <p className="text-[10px] text-concrete">{coupon.description}</p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-2.5 text-xs text-ash">
                {coupon.type === 'percent' ? 'Porcentaje' : coupon.type === 'fixed' ? 'Monto fijo' : 'Domicilio gratis'}
              </td>
              <td className="px-3 py-2.5 text-xs font-bold text-red">
                {coupon.type === 'percent' ? `${coupon.value}%` : coupon.type === 'fixed' ? money(coupon.value) : '—'}
              </td>
              <td className="px-3 py-2.5 text-xs text-ash">{money(coupon.minSubtotal)}</td>
              <td className="px-3 py-2.5 text-xs text-ash">
                {coupon.usedCount}
                {coupon.usageLimit ? `/${coupon.usageLimit}` : ''}
              </td>
              <td className="px-3 py-2.5 text-xs text-ash">{countdown(coupon.expiresAt)}</td>
              <td className="px-3 py-2.5">
                <Pill tone={coupon.active ? 'lime' : 'neutral'}>
                  {coupon.active ? 'Activo' : 'Pausado'}
                </Pill>
              </td>
              <td className="px-3 py-2.5">
                <div className="flex justify-end gap-1.5">
                  <IconButton
                    label="Editar"
                    className="size-8"
                    onClick={() => {
                      setIsNew(false)
                      setForm({ ...coupon })
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </IconButton>
                  <IconButton
                    label="Eliminar"
                    className="size-8 hover:border-flame/50 hover:text-flame"
                    onClick={() => {
                      deleteCoupon(coupon.id)
                      toast({ title: 'Cupón eliminado', description: coupon.code, tone: 'error' })
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </IconButton>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </AdminCard>

      <Sheet
        open={Boolean(form)}
        onClose={() => setForm(null)}
        title={isNew ? 'Nuevo cupón' : `Editar ${form?.code ?? ''}`}
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" fullWidth onClick={() => setForm(null)}>
              Cancelar
            </Button>
            <Button fullWidth onClick={save}>
              Guardar
            </Button>
          </div>
        }
      >
        {form && (
          <div className="space-y-3 pb-2">
            <Input
              label="Código"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              hint="Ej: PARCHE20, WELCOME, NOCHE"
            />
            <Input
              label="Descripción"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div>
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ash">
                Tipo
              </span>
              <Segmented
                value={form.type}
                onChange={(value) => setForm({ ...form, type: value as CouponType })}
                options={[
                  { value: 'percent', label: '% descuento' },
                  { value: 'fixed', label: '$ descuento' },
                  { value: 'free_delivery', label: 'Domicilio gratis' },
                ]}
              />
            </div>
            {form.type !== 'free_delivery' && (
              <Input
                label={form.type === 'percent' ? 'Porcentaje' : 'Monto'}
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
              />
            )}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Compra mínima"
                type="number"
                value={form.minSubtotal}
                onChange={(e) => setForm({ ...form, minSubtotal: Number(e.target.value) })}
              />
              <Input
                label="Tope de descuento"
                type="number"
                value={form.maxDiscount ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    maxDiscount: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
            <Input
              label="Vence el"
              type="date"
              value={form.expiresAt.slice(0, 10)}
              onChange={(e) =>
                setForm({ ...form, expiresAt: new Date(e.target.value).toISOString() })
              }
            />
            <Input
              label="Condiciones"
              value={form.conditions}
              onChange={(e) => setForm({ ...form, conditions: e.target.value })}
            />
            <Switch
              checked={form.active}
              onChange={(value) => setForm({ ...form, active: value })}
              label="Cupón activo"
              description="Los cupones pausados no se pueden aplicar"
            />
          </div>
        )}
      </Sheet>
    </div>
  )
}
