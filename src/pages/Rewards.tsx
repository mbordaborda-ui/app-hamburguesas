import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Award, Check, Flame, Gift, Lock, Sparkles, Ticket, Trophy, Users } from 'lucide-react'
import { Crown, SpraySplat } from '@/components/brand/StreetArt'
import { Button, LinkButton } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/Feedback'
import { levelById } from '@/lib/loyalty'
import { loyaltyLevels as levels } from '@/data/rewards'
import { money } from '@/lib/format'
import { cn, uid } from '@/lib/utils'
import { useLoyalty } from '@/hooks/useLoyalty'
import { useAuth } from '@/store/auth'
import { useCart } from '@/store/cart'
import { useDb } from '@/store/db'
import { toast } from '@/store/ui'
import type { Reward } from '@/types'

export default function Rewards() {
  const navigate = useNavigate()
  const { account, current, next, percent, remaining, isGuest } = useLoyalty()
  const rewards = useDb((s) => s.rewards)
  const missions = useDb((s) => s.missions)
  const badges = useDb((s) => s.badges)
  const products = useDb((s) => s.products)
  const settings = useDb((s) => s.settings)
  const spendPoints = useDb((s) => s.spendPoints)
  const claimMission = useDb((s) => s.claimMission)
  const addPoints = useDb((s) => s.addPoints)
  const pushNotification = useDb((s) => s.pushNotification)
  const upsertCoupon = useDb((s) => s.upsertCoupon)
  const user = useAuth((s) => s.user)
  const addLine = useCart((s) => s.addLine)
  const setCoupon = useCart((s) => s.setCoupon)
  const [tab, setTab] = useState<'rewards' | 'missions' | 'badges'>('rewards')

  const levelOrder = ['rookie', 'crew', 'street_boss', 'legend']
  const unlocked = (reward: Reward) =>
    !reward.requiresLevel ||
    levelOrder.indexOf(current.id) >= levelOrder.indexOf(reward.requiresLevel)

  const redeem = (reward: Reward) => {
    if (isGuest) {
      navigate('/login')
      return
    }
    if (!user) return
    if (account.points < reward.cost) {
      toast({
        title: 'Te faltan puntos',
        description: `Necesitas ${reward.cost - account.points} pts más.`,
        tone: 'error',
      })
      return
    }

    spendPoints(user.id, reward.cost)

    if (reward.type === 'discount') {
      const code = `PARCHE${Math.floor(100 + Math.random() * 899)}`
      upsertCoupon({
        id: uid('c'),
        code,
        description: reward.title,
        type: 'fixed',
        value: 10000,
        minSubtotal: 30000,
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        conditions: 'Canjeado con Street Points. Válido por 30 días.',
        active: true,
        usedCount: 0,
        emoji: '🎟️',
      })
      setCoupon(code)
      pushNotification({
        type: 'reward',
        title: `Canjeaste ${reward.title}`,
        body: `Tu código ${code} ya está aplicado en el carrito.`,
        emoji: '🎟️',
        actionUrl: '/cart',
      })
      toast({ title: '¡Recompensa canjeada!', description: `${code} aplicado al carrito`, emoji: '🎟️', tone: 'reward' })
      navigate('/cart')
      return
    }

    if (reward.id === 'r_fries' || reward.id === 'r_drink' || reward.id === 'r_burger') {
      const productId =
        reward.id === 'r_fries' ? 'p_papas_clasicas' : reward.id === 'r_drink' ? 'p_cola' : 'p_callejera'
      const product = products.find((p) => p.id === productId)
      if (product) {
        addLine({
          productId: product.id,
          name: `${product.name} (GRATIS)`,
          image: product.image,
          basePrice: 0,
          unitPrice: 0,
          quantity: 1,
          selections: [],
        })
      }
      toast({ title: '¡Recompensa canjeada!', description: 'Agregado gratis a tu pedido', emoji: reward.emoji, tone: 'reward' })
      navigate('/cart')
      return
    }

    pushNotification({
      type: 'reward',
      title: `Canjeaste ${reward.title}`,
      body: reward.description,
      emoji: reward.emoji,
    })
    toast({ title: '¡Recompensa canjeada!', description: reward.title, emoji: reward.emoji, tone: 'reward' })
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Header */}
      <header className="relative overflow-hidden rounded-[28px] border border-red/25 bg-gradient-to-br from-red/[0.14] via-carbon to-carbon p-5 sm:p-7">
        <div className="texture-brick absolute inset-0 opacity-20" />
        <SpraySplat seed={17} className="absolute -left-16 -top-14 size-56 text-red/[0.1]" />
        <div className="relative">
          <p className="font-marker text-sm text-red">Programa de fidelización</p>
          <h1 className="font-display text-3xl text-bone sm:text-4xl">Street Points</h1>
          <p className="mt-1 max-w-lg text-sm text-ash">
            $1.000 gastados = 1 punto. Sube de nivel, desbloquea el menú secreto y canjea por
            comida real.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-2">
              <div className="flex items-end gap-3">
                <span className="font-display text-4xl text-red">{account.points}</span>
                <span className="pb-1 text-xs font-bold uppercase tracking-wider text-ash">
                  puntos disponibles
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-bone">
                  <span>{current.emoji}</span> {current.name}
                </span>
                {next && (
                  <span className="text-concrete">
                    {account.lifetimePoints} / {next.minPoints}
                  </span>
                )}
              </div>
              <ProgressBar value={percent} showGlow />
              {next ? (
                <p className="text-[11px] text-ash">
                  Te faltan <span className="font-bold text-red">{remaining} pts</span> para{' '}
                  {next.emoji} {next.name} · ganas {next.multiplier}x puntos
                </p>
              ) : (
                <p className="text-[11px] font-bold text-flame">
                  🔥 Nivel máximo. Puntos x2 en cada pedido.
                </p>
              )}
            </div>

            <div className="flex gap-2">
              {isGuest ? (
                <LinkButton to="/register">Crear cuenta</LinkButton>
              ) : (
                <LinkButton to="/menu" variant="primary">
                  Pedir y ganar
                </LinkButton>
              )}
            </div>
          </div>

          {account.streak > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-flame/15 px-3.5 py-2">
              <Flame className="size-4 text-flame" />
              <span className="text-xs font-bold text-bone">
                Racha de {account.streak} pedidos consecutivos
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Niveles */}
      <section className="mt-6">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg text-bone">
          <Trophy className="size-4 text-red" /> Niveles del parche
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {levels.map((level) => {
            const active = level.id === current.id
            const reached = account.lifetimePoints >= level.minPoints
            return (
              <div
                key={level.id}
                className={cn(
                  'rounded-3xl border p-4 transition',
                  active
                    ? 'border-red/60 bg-red/[0.08]'
                    : reached
                      ? 'border-white/15 bg-white/[0.03]'
                      : 'border-white/[0.07] bg-carbon opacity-70',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="relative grid size-9 place-items-center">
                    {level.id === 'legend' && (
                      <Crown className="absolute -top-2 size-5 text-flame/70" />
                    )}
                    <span className="text-2xl">{level.emoji}</span>
                  </span>
                  {active && <Pill tone="volt">Estás aquí</Pill>}
                </div>
                <p className="mt-2 font-display text-sm uppercase text-bone">{level.name}</p>
                <p className="text-[11px] text-concrete">Desde {level.minPoints} pts</p>
                <ul className="mt-2 space-y-1">
                  {level.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-1.5 text-[11px] text-ash">
                      <Check className="mt-0.5 size-3 shrink-0 text-red" /> {perk}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      {/* Tabs */}
      <div className="mt-6 flex gap-2">
        {(
          [
            { id: 'rewards', label: 'Recompensas', icon: Gift },
            { id: 'missions', label: 'Misiones', icon: Sparkles },
            { id: 'badges', label: 'Insignias', icon: Award },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-xs font-bold uppercase tracking-wide transition',
              tab === item.id
                ? 'border-red bg-red text-white'
                : 'border-white/10 bg-white/[0.03] text-ash hover:border-white/25',
            )}
          >
            <item.icon className="size-3.5" />
            {item.label}
          </button>
        ))}
      </div>

      {/* Recompensas */}
      {tab === 'rewards' && (
        <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rewards.map((reward) => {
            const canRedeem = account.points >= reward.cost && unlocked(reward) && reward.available
            return (
              <div
                key={reward.id}
                className={cn(
                  'flex flex-col rounded-3xl border p-4',
                  canRedeem ? 'border-white/12 bg-carbon' : 'border-white/[0.06] bg-carbon/60',
                )}
              >
                <div className="flex items-start justify-between">
                  <span className="grid size-11 place-items-center rounded-2xl bg-white/[0.06] text-xl">
                    {reward.emoji}
                  </span>
                  <Pill tone={canRedeem ? 'volt' : 'outline'}>{reward.cost} pts</Pill>
                </div>
                <p className="mt-3 font-display text-sm uppercase text-bone">{reward.title}</p>
                <p className="mt-1 flex-1 text-[11px] leading-relaxed text-ash">
                  {reward.description}
                </p>
                {reward.requiresLevel && !unlocked(reward) && (
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-grape">
                    <Lock className="size-3" /> Requiere nivel{' '}
                    {levelById(reward.requiresLevel).name}
                  </p>
                )}
                <Button
                  className="mt-3"
                  size="sm"
                  fullWidth
                  variant={canRedeem ? 'primary' : 'outline'}
                  disabled={!canRedeem}
                  onClick={() => redeem(reward)}
                >
                  {canRedeem ? 'Canjear' : isGuest ? 'Inicia sesión' : 'Faltan puntos'}
                </Button>
              </div>
            )
          })}
        </section>
      )}

      {/* Misiones */}
      {tab === 'missions' && (
        <section className="mt-4 space-y-3">
          {missions.map((mission) => {
            const complete = mission.progress >= mission.goal
            return (
              <div
                key={mission.id}
                className="flex items-center gap-4 rounded-3xl border border-white/[0.08] bg-carbon p-4"
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
                        ? `${money(Math.min(mission.progress, mission.goal))}/${money(mission.goal)}`
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
                        title: `¡Misión completada!`,
                        description: `+${mission.rewardPoints} Street Points`,
                        emoji: mission.emoji,
                        tone: 'reward',
                      })
                    }}
                  >
                    {complete ? 'Reclamar' : 'En curso'}
                  </Button>
                )}
              </div>
            )
          })}
        </section>
      )}

      {/* Insignias */}
      {tab === 'badges' && (
        <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                  'grid size-12 shrink-0 place-items-center rounded-2xl text-2xl',
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
        </section>
      )}

      {/* Referidos */}
      <section className="mt-6 flex flex-col gap-4 rounded-[28px] border border-white/[0.08] bg-carbon p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-yellow/15 text-yellow">
            <Users className="size-5" />
          </span>
          <div>
            <p className="font-display text-lg text-bone">Invita a tu parche</p>
            <p className="text-xs text-ash">
              Ganas {money(settings.pointsValue * 300)} en puntos por cada amigo que pida.
            </p>
          </div>
        </div>
        <LinkButton to="/profile/referrals" variant="outline" icon={<Ticket className="size-4" />}>
          Ver mi código
        </LinkButton>
      </section>

      <p className="mt-6 text-center text-[11px] text-concrete">
        Los puntos se acreditan al confirmar el pago.{' '}
        <Link to="/profile/missions" className="text-red hover:underline">
          Ver todas mis misiones
        </Link>
      </p>
    </div>
  )
}
