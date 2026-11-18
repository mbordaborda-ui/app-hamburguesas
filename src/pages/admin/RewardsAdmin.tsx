import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { AdminCard, DataTable } from '@/components/admin/AdminBits'
import { Button, IconButton } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Sheet } from '@/components/ui/Sheet'
import { loyaltyLevels } from '@/data/rewards'
import { money } from '@/lib/format'
import { uid } from '@/lib/utils'
import { useDb } from '@/store/db'
import { toast } from '@/store/ui'
import type { Reward } from '@/types'

const emptyReward = (): Reward => ({
  id: uid('r'),
  title: '',
  description: '',
  cost: 500,
  emoji: '🎁',
  type: 'discount',
  available: true,
})

export default function RewardsAdmin() {
  const rewards = useDb((s) => s.rewards)
  const missions = useDb((s) => s.missions)
  const upsertReward = useDb((s) => s.upsertReward)
  const deleteReward = useDb((s) => s.deleteReward)
  const setMissionProgress = useDb((s) => s.setMissionProgress)
  const settings = useDb((s) => s.settings)
  const updateSettings = useDb((s) => s.updateSettings)

  const [form, setForm] = useState<Reward | null>(null)

  return (
    <div className="space-y-5">
      <AdminCard title="Configuración del programa" subtitle="Reglas de acumulación y valor de los puntos">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="$ gastados por 1 punto"
            type="number"
            value={settings.pointsPerCurrency}
            onChange={(e) => updateSettings({ pointsPerCurrency: Number(e.target.value) || 1000 })}
          />
          <Input
            label="Valor de 1 punto (COP)"
            type="number"
            value={settings.pointsValue}
            onChange={(e) => updateSettings({ pointsValue: Number(e.target.value) || 10 })}
          />
        </div>
        <p className="mt-3 text-[11px] text-concrete">
          Actualmente: {money(settings.pointsPerCurrency)} = 1 punto · 1 punto = {money(settings.pointsValue)} de descuento.
        </p>
      </AdminCard>

      <AdminCard title="Niveles" subtitle="Escalafón del parche">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {loyaltyLevels.map((level) => (
            <div key={level.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{level.emoji}</span>
                <Pill tone="outline">{level.multiplier}x puntos</Pill>
              </div>
              <p className="mt-2 font-display text-sm uppercase text-bone">{level.name}</p>
              <p className="text-[11px] text-concrete">Desde {level.minPoints} pts</p>
              <ul className="mt-2 space-y-1">
                {level.perks.map((perk) => (
                  <li key={perk} className="text-[11px] text-ash">
                    · {perk}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard
        title="Recompensas canjeables"
        subtitle={`${rewards.length} recompensas configuradas`}
        action={
          <Button size="sm" icon={<Plus className="size-4" />} onClick={() => setForm(emptyReward())}>
            Nueva
          </Button>
        }
      >
        <DataTable headers={['Recompensa', 'Tipo', 'Costo', 'Nivel', 'Estado', '']}>
          {rewards.map((reward) => (
            <tr key={reward.id} className="border-b border-white/[0.05] last:border-0">
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span>{reward.emoji}</span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-bone">{reward.title}</p>
                    <p className="truncate text-[10px] text-concrete">{reward.description}</p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-2.5 text-xs text-ash">{reward.type}</td>
              <td className="px-3 py-2.5 text-xs font-bold text-red">{reward.cost} pts</td>
              <td className="px-3 py-2.5 text-xs text-ash">{reward.requiresLevel ?? '—'}</td>
              <td className="px-3 py-2.5">
                <Pill tone={reward.available ? 'lime' : 'neutral'}>
                  {reward.available ? 'Disponible' : 'Pausada'}
                </Pill>
              </td>
              <td className="px-3 py-2.5">
                <div className="flex justify-end gap-1.5">
                  <IconButton label="Editar" className="size-8" onClick={() => setForm({ ...reward })}>
                    <Pencil className="size-3.5" />
                  </IconButton>
                  <IconButton
                    label="Eliminar"
                    className="size-8 hover:border-flame/50 hover:text-flame"
                    onClick={() => {
                      deleteReward(reward.id)
                      toast({ title: 'Recompensa eliminada', description: reward.title, tone: 'error' })
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

      <AdminCard title="Misiones" subtitle="Ajusta el progreso para pruebas o campañas">
        <div className="space-y-2">
          {missions.map((mission) => (
            <div
              key={mission.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3"
            >
              <span className="text-lg">{mission.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-bone">{mission.title}</p>
                <p className="text-[10px] text-concrete">
                  {mission.type} · meta {mission.goal} · +{mission.rewardPoints} pts
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={mission.goal}
                  value={Math.min(mission.progress, mission.goal)}
                  onChange={(e) => setMissionProgress(mission.id, Number(e.target.value))}
                  className="w-32 accent-[#FFD400]"
                />
                <span className="w-10 text-right text-xs font-bold text-red">
                  {Math.min(mission.progress, mission.goal)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>

      <Sheet
        open={Boolean(form)}
        onClose={() => setForm(null)}
        title="Recompensa"
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" fullWidth onClick={() => setForm(null)}>
              Cancelar
            </Button>
            <Button
              fullWidth
              onClick={() => {
                if (!form || !form.title.trim()) return
                upsertReward(form)
                toast({ title: 'Recompensa guardada', description: form.title, emoji: form.emoji, tone: 'success' })
                setForm(null)
              }}
            >
              Guardar
            </Button>
          </div>
        }
      >
        {form && (
          <div className="space-y-3 pb-2">
            <Input
              label="Emoji"
              value={form.emoji}
              onChange={(e) => setForm({ ...form, emoji: e.target.value })}
            />
            <Input
              label="Título"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Input
              label="Descripción"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <Input
              label="Costo en puntos"
              type="number"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })}
            />
            <div>
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ash">
                Nivel requerido
              </span>
              <select
                value={form.requiresLevel ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    requiresLevel: (e.target.value || undefined) as Reward['requiresLevel'],
                  })
                }
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-3 text-sm text-bone focus:border-red/70 focus:outline-none"
              >
                <option value="">Sin requisito</option>
                {loyaltyLevels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.emoji} {level.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}
