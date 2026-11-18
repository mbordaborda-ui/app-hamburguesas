import { useState } from 'react'
import { Briefcase, Home, MapPin, Plus, Star, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Feedback'
import { Input } from '@/components/ui/Input'
import { Sheet } from '@/components/ui/Sheet'
import { cn, uid } from '@/lib/utils'
import { useAuth } from '@/store/auth'
import { useDb } from '@/store/db'
import { toast, useUi } from '@/store/ui'
import type { Address } from '@/types'

const icons = { Casa: Home, Trabajo: Briefcase, Otra: MapPin }

export default function Addresses() {
  const user = useAuth((s) => s.user)
  const addresses = useDb((s) => s.addresses)
  const upsertAddress = useDb((s) => s.upsertAddress)
  const removeAddress = useDb((s) => s.removeAddress)
  const setDefaultAddress = useDb((s) => s.setDefaultAddress)
  const setActiveAddress = useUi((s) => s.setActiveAddress)
  const activeAddressId = useUi((s) => s.activeAddressId)

  const [open, setOpen] = useState(false)
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
    upsertAddress(user?.id ?? 'guest', address)
    setActiveAddress(address.id)
    setOpen(false)
    setForm({ label: 'Casa', line: '', details: '', city: 'Bogotá' })
    toast({ title: 'Dirección guardada', emoji: '📍', tone: 'success' })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <PageHeader
        eyebrow="Entregas"
        title="Mis direcciones"
        description="Guarda Casa, Trabajo u otra dirección para pedir en segundos."
        action={
          <Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>
            Nueva
          </Button>
        }
      />

      {addresses.length === 0 ? (
        <EmptyState
          emoji="📍"
          title="Sin direcciones guardadas"
          description="Agrega tu primera dirección de entrega."
          action={<Button onClick={() => setOpen(true)}>Agregar dirección</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {addresses.map((address) => {
            const Icon = icons[address.label as keyof typeof icons] ?? MapPin
            return (
              <li
                key={address.id}
                className={cn(
                  'rounded-3xl border p-4 transition',
                  activeAddressId === address.id
                    ? 'border-red/50 bg-red/[0.06]'
                    : 'border-white/[0.08] bg-carbon',
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/[0.05] text-ash">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-bone">{address.label}</p>
                      {address.isDefault && (
                        <span className="rounded-full bg-red/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red">
                          Predeterminada
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-ash">{address.line}</p>
                    {address.details && (
                      <p className="text-xs text-concrete">{address.details}</p>
                    )}
                    <p className="text-xs text-concrete">{address.city}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAddress(address.id)
                      toast({ title: 'Dirección activa', description: address.label, emoji: '✅', tone: 'success' })
                    }}
                    className="rounded-xl border border-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ash transition hover:border-red/50 hover:text-red"
                  >
                    Usar esta
                  </button>
                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() => setDefaultAddress(user?.id ?? 'guest', address.id)}
                      className="flex items-center gap-1 rounded-xl border border-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ash transition hover:border-red/50 hover:text-red"
                    >
                      <Star className="size-3" /> Predeterminada
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAddress(user?.id ?? 'guest', address.id)}
                    className="ml-auto flex items-center gap-1 rounded-xl border border-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ash transition hover:border-flame/50 hover:text-flame"
                  >
                    <Trash2 className="size-3" /> Eliminar
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Nueva dirección">
        <div className="space-y-3 pb-2">
          <div className="flex gap-2">
            {['Casa', 'Trabajo', 'Otra'].map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setForm((f) => ({ ...f, label }))}
                className={cn(
                  'flex-1 rounded-xl border px-3 py-2.5 text-xs font-bold uppercase tracking-wide transition',
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
            label="Detalles"
            placeholder="Torre B, portería azul"
            value={form.details}
            onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
          />
          <Input
            label="Ciudad"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
          <Button fullWidth size="lg" onClick={save}>
            Guardar dirección
          </Button>
        </div>
      </Sheet>
    </div>
  )
}
