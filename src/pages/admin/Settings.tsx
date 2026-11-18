import { Plus, Trash2 } from 'lucide-react'
import { AdminCard } from '@/components/admin/AdminBits'
import { StoreStatusPill } from '@/components/store/StoreHours'
import { Button } from '@/components/ui/Button'
import { Input, Segmented, Switch } from '@/components/ui/Input'
import { DAY_LABELS, WEEK_ORDER, alwaysOpenHours, summarizeShifts } from '@/lib/hours'
import { useStoreStatus } from '@/hooks/useStoreStatus'
import { useDb } from '@/store/db'
import type { Shift, WeeklyHours } from '@/types'

const timeClass =
  'h-10 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-bone [color-scheme:dark] focus:border-red/70 focus:outline-none'

export default function AdminSettings() {
  const settings = useDb((s) => s.settings)
  const updateSettings = useDb((s) => s.updateSettings)
  const status = useStoreStatus()

  const hours: WeeklyHours = settings.hours ?? []
  const byDay = new Map(hours.map((entry) => [entry.day, entry.shifts]))

  const setDay = (day: number, shifts: Shift[]) => {
    const exists = hours.some((entry) => entry.day === day)
    const next = exists
      ? hours.map((entry) => (entry.day === day ? { ...entry, shifts } : entry))
      : [...hours, { day, shifts }]
    updateSettings({ hours: next })
  }

  const toggleDay = (day: number, open: boolean) => {
    if (!open) return setDay(day, [])
    const shifts = byDay.get(day) ?? []
    setDay(day, shifts.length > 0 ? shifts : [{ open: '12:00', close: '22:00' }])
  }

  const updateShift = (day: number, index: number, patch: Partial<Shift>) =>
    setDay(
      day,
      (byDay.get(day) ?? []).map((shift, i) => (i === index ? { ...shift, ...patch } : shift)),
    )

  const addShift = (day: number) => {
    const shifts = byDay.get(day) ?? []
    const last = shifts[shifts.length - 1]
    setDay(day, [...shifts, { open: last?.close ?? '12:00', close: '22:00' }])
  }

  const removeShift = (day: number, index: number) =>
    setDay(
      day,
      (byDay.get(day) ?? []).filter((_, i) => i !== index),
    )

  return (
    <div className="space-y-5">
      <AdminCard
        title="Estado del local"
        subtitle="Interruptor maestro de pedidos"
        action={<StoreStatusPill />}
      >
        <Switch
          checked={settings.isOpen}
          onChange={(value) => updateSettings({ isOpen: value })}
          label={settings.isOpen ? 'Recibiendo pedidos' : 'Pedidos en pausa'}
          description="Si lo apagas, el checkout se bloquea aunque el horario diga abierto."
        />
        <p className="mt-3 text-[11px] text-concrete">{status.detail}</p>
      </AdminCard>

      <AdminCard
        title="Horario de atención"
        subtitle="Un turno por franja. Puedes tener varios turnos por día."
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateSettings({ hours: alwaysOpenHours() })}
          >
            Abrir 24 h
          </Button>
        }
      >
        <ul className="space-y-2">
          {WEEK_ORDER.map((day) => {
            const shifts = byDay.get(day) ?? []
            const open = shifts.length > 0
            return (
              <li key={day} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3">
                <Switch
                  checked={open}
                  onChange={(value) => toggleDay(day, value)}
                  label={DAY_LABELS[day]}
                  description={open ? summarizeShifts(shifts) : 'Cerrado'}
                />

                {open && (
                  <div className="mt-3 space-y-2">
                    {shifts.map((shift, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="time"
                          value={shift.open}
                          onChange={(event) => updateShift(day, index, { open: event.target.value })}
                          aria-label={`Apertura ${DAY_LABELS[day]}`}
                          className={timeClass}
                        />
                        <span className="text-concrete">–</span>
                        <input
                          type="time"
                          value={shift.close}
                          onChange={(event) => updateShift(day, index, { close: event.target.value })}
                          aria-label={`Cierre ${DAY_LABELS[day]}`}
                          className={timeClass}
                        />
                        <button
                          type="button"
                          onClick={() => removeShift(day, index)}
                          aria-label="Quitar turno"
                          className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 text-ash transition hover:border-flame/40 hover:text-flame"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addShift(day)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-red transition hover:gap-2"
                    >
                      <Plus className="size-3.5" /> Agregar turno
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </AdminCard>

      <AdminCard
        title="Datos legales de facturación"
        subtitle="Requisitos de la factura de venta en Colombia"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Razón social"
            value={settings.legalName ?? ''}
            onChange={(event) => updateSettings({ legalName: event.target.value })}
            placeholder="EL PARCHE S.A.S."
          />
          <Input
            label="NIT"
            value={settings.nit ?? ''}
            onChange={(event) => updateSettings({ nit: event.target.value })}
            placeholder="901.234.567-8"
          />
          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ash">
              Régimen / responsabilidad
            </span>
            <Segmented
              value={settings.taxRegime ?? 'responsable_iva'}
              onChange={(value) => updateSettings({ taxRegime: value })}
              options={[
                { value: 'responsable_iva', label: 'Resp. IVA' },
                { value: 'no_responsable', label: 'No resp.' },
                { value: 'simple', label: 'Simple' },
                { value: 'gran_contribuyente', label: 'Gran contrib.' },
              ]}
            />
          </div>
          <Input
            label="Dirección fiscal"
            value={settings.legalAddress ?? ''}
            onChange={(event) => updateSettings({ legalAddress: event.target.value })}
            placeholder="Cra. 45 # 12-34, Bogotá D.C."
          />
          <Input
            label="Teléfono"
            value={settings.legalPhone ?? ''}
            onChange={(event) => updateSettings({ legalPhone: event.target.value })}
            placeholder="+57 300 000 0000"
          />
          <Input
            label="Correo de facturación"
            type="email"
            value={settings.legalEmail ?? ''}
            onChange={(event) => updateSettings({ legalEmail: event.target.value })}
            placeholder="facturacion@elparche.co"
          />
          <Input
            label="Prefijo del consecutivo"
            value={settings.invoicePrefix ?? ''}
            onChange={(event) => updateSettings({ invoicePrefix: event.target.value.toUpperCase() })}
            placeholder="EP-F"
          />
          <Input
            label="Resolución DIAN"
            value={settings.resolutionNumber ?? ''}
            onChange={(event) => updateSettings({ resolutionNumber: event.target.value })}
            placeholder="18764001234567"
          />
          <Input
            label="Fecha de la resolución"
            type="date"
            value={settings.resolutionDate ?? ''}
            onChange={(event) => updateSettings({ resolutionDate: event.target.value })}
          />
          <Input
            label="Numeración desde"
            type="number"
            min={1}
            value={settings.resolutionFrom ?? ''}
            onChange={(event) =>
              updateSettings({
                resolutionFrom: event.target.value ? Number(event.target.value) : undefined,
              })
            }
          />
          <Input
            label="Numeración hasta"
            type="number"
            min={1}
            value={settings.resolutionTo ?? ''}
            onChange={(event) =>
              updateSettings({
                resolutionTo: event.target.value ? Number(event.target.value) : undefined,
              })
            }
          />
          <Input
            label="IVA (%)"
            type="number"
            min={0}
            max={100}
            step={1}
            value={Math.round((settings.taxRate ?? 0) * 100)}
            onChange={(event) =>
              updateSettings({ taxRate: (Number(event.target.value) || 0) / 100 })
            }
            hint="Incluido en el precio. La factura lo discrimina sin cambiar el total."
          />
          <Input
            label="INC (%)"
            type="number"
            min={0}
            max={100}
            step={1}
            value={Math.round((settings.consumptionTaxRate ?? 0) * 100)}
            onChange={(event) =>
              updateSettings({ consumptionTaxRate: (Number(event.target.value) || 0) / 100 })
            }
          />
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-concrete">
          Estos datos se imprimen en la factura de cada pedido. El CUFE se genera de forma simulada:
          conéctalo a la DIAN cuando pases a producción.
        </p>
      </AdminCard>
    </div>
  )
}
