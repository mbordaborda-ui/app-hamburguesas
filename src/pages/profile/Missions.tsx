import { Award, Check, Flame } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/Feedback'
import { money } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useLoyalty } from '@/hooks/useLoyalty'
import { useAuth } from '@/store/auth'
import { useDb } from '@/store/db'
import { toast } from '@/store/ui'

export default function Missions() {
  const missions = useDb((s) => s.missions)
  const badges = useDb((s) => s.badges)
  const claimMission = useDb((s) => s.claimMission)
  const addPoints = useDb((s) => s.addPoints)
  const { account } = useLoyalty()
  const user = useAuth((s) => s.user)

  const completed = missions.filter((m) => m.progress >= m.goal).length

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <PageHeader
        eyebrow="Gamificación"
        title="Misiones y logros"
        description={`${completed} de ${missions.length} misiones completadas · racha de ${account.streak} pedidos`}
      />

      <div className="mb-5 flex items-center gap-3 rounded-3xl border border-flame/25 bg-flame/[0.07] p-4">
        <span className="grid size-11 place-items-center rounded-2xl bg-flame/15 text-flame">
          <Flame className="size-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-bold text-bone">
            {account.streak > 0 ? `🔥 ${account.streak} pedidos consecutivos` : 'Empieza tu racha'}
          </p>
          <p className="text-xs text-ash">
            {account.streak >= 3
              ? '¡Racha activa! Sigue pidiendo para multiplicar puntos.'
              : 'Haz 3 pedidos seguidos y desbloquea puntos extra.'}
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {missions.map((mission) => {
          const complete = mission.progress >= mission.goal
          return (
            <li
              key={mission.id}
              className={cn(
                'flex items-center gap-4 rounded-3xl border p-4',
                complete ? 'border-lime/30 bg-lime/[0.05]' : 'border-white/[0.08] bg-carbon',
              )}
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/[0.06] text-xl">
                {mission.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold text-bone">{mission.title}</p>
                  <span className="shrink-0 text-[11px] font-bold text-red">
                    +{mission.rewardPoints} pts
                  </span>
                </div>
                <p className="text-[11px] text-ash">{mission.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <ProgressBar
                    value={Math.min(mission.progress, mission.goal)}
                    max={mission.goal}
                    tone={complete ? 'lime' : 'volt'}
                    className="h-1.5"
                  />
                  <span className="shrink-0 text-[10px] font-bold text-concrete">
                    {mission.type === 'spend_amount'
                      ? `${money(Math.min(mission.progress, mission.goal))}`
                      : `${Math.min(mission.progress, mission.goal)}/${mission.goal}`}
                  </span>
                </div>
              </div>
              {mission.claimed ? (
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-lime/15 text-lime">
                  <Check className="size-4" />
                </span>
              ) : (
                <Button
                  size="sm"
                  disabled={!complete || !user}
                  onClick={() => {
                    if (!user) return
                    claimMission(mission.id)
                    addPoints(user.id, mission.rewardPoints)
                    toast({
                      title: '¡Misión completada!',
                      description: `+${mission.rewardPoints} Street Points`,
                      emoji: mission.emoji,
                      tone: 'reward',
                    })
                  }}
                >
                  {complete ? 'Reclamar' : 'En curso'}
                </Button>
              )}
            </li>
          )
        })}
      </ul>

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg text-bone">
          <Award className="size-4 text-red" /> Insignias
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={cn(
                'flex items-center gap-3 rounded-3xl border p-4',
                badge.unlockedAt
                  ? 'border-red/40 bg-red/[0.06]'
                  : 'border-white/[0.07] bg-carbon opacity-60',
              )}
            >
              <span
                className={cn(
                  'grid size-11 shrink-0 place-items-center rounded-2xl text-2xl',
                  badge.unlockedAt ? 'bg-red/20' : 'bg-white/[0.05] grayscale',
                )}
              >
                {badge.emoji}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-bone">{badge.name}</p>
                <p className="text-[11px] text-ash">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
