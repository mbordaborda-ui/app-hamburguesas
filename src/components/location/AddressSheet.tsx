import { useState } from 'react'
import { Briefcase, Check, Home, MapPin, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Sheet } from '@/components/ui/Sheet'
import { cn, uid } from '@/lib/utils'
import { useDb } from '@/store/db'
import { useUi, toast } from '@/store/ui'
import type { Address } from '@/types'

const labelIcon = (label: string) => {
  if (label === 'Casa') return <Home className="size-4" />
  if (label === 'Trabajo') return <Briefcase className="size-4" />
  return <MapPin className="size-4" />
}

export function AddressSheet() {
  const open = useUi((s) => s.addressPickerOpen)
  const setOpen = useUi((s) => s.setAddressPickerOpen)
  const activeAddressId = useUi((s) => s.activeAddressId)
  const setActiveAddress = useUi((s) => s.setActiveAddress)

  const addresses = useDb((s) => s.addresses)
  const upsertAddress = useDb((s) => s.upsertAddress)
  const removeAddress = useDb((s) => s.removeAddress)

  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ label: 'Casa', line: '', details: '', city: 'Bogotá' })

  const save = () => {
    if (!form.line.trim()) return
    const address: Address = {
      id: uid('addr'),
      label: form.label,
      line: form.line.trim(),
      details: form.details.trim() || undefined,
      city: form.city.trim() || 'Bogotá',
      isDefault: addresses.length === 0,
    }
    upsertAddress('guest', address)
    setActiveAddress(address.id)
    setForm({ label: 'Casa', line: '', details: '', city: 'Bogotá' })
    setCreating(false)
    toast({ title: 'Dirección guardada', emoji: '📍', tone: 'success' })
  }

  return (
    <Sheet
      open={open}
      onClose={() => setOpen(false)}
      title="¿A dónde va el parche?"
      subtitle="Elige o agrega una dirección de entrega"
    >
      <div className="space-y-3">
        {addresses.map((address) => (
          <div
            key={address.id}
            className={cn(
              'flex items-start gap-3 rounded-2xl border p-3.5 transition',
              activeAddressId === address.id
                ? 'border-red/60 bg-red/[0.07]'
                : 'border-white/10 bg-white/[0.02]',
            )}
          >
            <button
              type="button"
              onClick={() => {
                setActiveAddress(address.id)
                setOpen(false)
              }}
              className="flex flex-1 items-start gap-3 text-left"
            >
              <span
                className={cn(
                  'mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl',
                  activeAddressId === address.id ? 'bg-red text-white' : 'bg-white/[0.06] text-ash',
                )}
              >
                {labelIcon(address.label)}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-bold text-bone">{address.label}</span>
                  {address.isDefault && (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ash">
                      Predeterminada
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-xs text-ash">{address.line}</span>
                {address.details && (
                  <span className="block truncate text-xs text-concrete">{address.details}</span>
                )}
              </span>
            </button>
            <button
              type="button"
              onClick={() => removeAddress('guest', address.id)}
              aria-label="Eliminar dirección"
              className="mt-1 text-concrete transition hover:text-flame"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}

        {creating ? (
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex gap-2">
              {['Casa', 'Trabajo', 'Otra'].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, label }))}
                  className={cn(
                    'flex-1 rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wide transition',
                    form.label === label
                      ? 'border-red bg-red text-white'
                      : 'border-white/10 text-ash hover:border-white/25',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <Input
              label="Dirección"
              placeholder="Cra 45 #23-12, Apto 502"
              value={form.line}
              onChange={(e) => setForm((f) => ({ ...f, line: e.target.value }))}
            />
            <Input
              label="Detalles (opcional)"
              placeholder="Torre B, portería azul"
              value={form.details}
              onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
            />
            <Input
              label="Ciudad"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
            <div className="flex gap-2">
              <Button variant="ghost" fullWidth onClick={() => setCreating(false)}>
                Cancelar
              </Button>
              <Button fullWidth onClick={save} icon={<Check className="size-4" />}>
                Guardar
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            fullWidth
            onClick={() => setCreating(true)}
            icon={<Plus className="size-4" />}
          >
            Agregar dirección
          </Button>
        )}
      </div>
    </Sheet>
  )
}
