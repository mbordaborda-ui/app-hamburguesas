import type { ReactNode } from 'react'
import { Copy, Gift, Share2, UserPlus, Users } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/store/auth'
import { useDb } from '@/store/db'
import { toast } from '@/store/ui'

export default function Referrals() {
  const user = useAuth((s) => s.user)
  const users = useDb((s) => s.users)
  const pushNotification = useDb((s) => s.pushNotification)

  const code = user?.referralCode ?? 'PARCHE'
  const joined = users.filter((u) => u.referredBy === code)
  const invited = Math.max(joined.length, 0)
  const pointsEarned = invited * 300

  const share = async () => {
    const text = `Pide en EL PARCHE con mi código ${code} y ambos ganamos Street Points 🍔🔥`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'EL PARCHE', text, url: window.location.origin })
        return
      } catch {
        /* cancelado */
      }
    }
    void navigator.clipboard?.writeText(`${text} ${window.location.origin}`)
    toast({ title: 'Invitación copiada', emoji: '🤝', tone: 'success' })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <PageHeader
        eyebrow="Crece el parche"
        title="Invita a tu parche"
        description="Comparte tu código. Cuando tu amigo haga su primer pedido, ambos ganan puntos."
      />

      <div className="relative overflow-hidden rounded-[28px] border border-yellow/25 bg-gradient-to-br from-yellow/[0.1] via-carbon to-carbon p-6 text-center">
        <div className="graffiti-stroke absolute -right-10 top-4 h-20 w-72 rotate-[-8deg] opacity-20" />
        <p className="relative font-marker text-sm text-yellow">Tu código de referido</p>
        <p className="relative mt-2 font-display text-4xl tracking-[0.2em] text-bone sm:text-5xl">
          {code}
        </p>
        <div className="relative mt-5 flex flex-wrap justify-center gap-2">
          <Button icon={<Copy className="size-4" />} onClick={() => {
            void navigator.clipboard?.writeText(code)
            toast({ title: 'Código copiado', description: code, emoji: '📋' })
          }}>
            Copiar código
          </Button>
          <Button variant="outline" icon={<Share2 className="size-4" />} onClick={share}>
            Compartir
          </Button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <Stat icon={<UserPlus className="size-4" />} label="Invitados" value={String(invited)} />
        <Stat icon={<Users className="size-4" />} label="Se unieron" value={String(joined.length)} />
        <Stat icon={<Gift className="size-4" />} label="Puntos" value={String(pointsEarned)} />
      </div>

      <div className="mt-5 rounded-3xl border border-white/[0.08] bg-carbon p-5">
        <h2 className="font-display text-sm uppercase tracking-wide text-bone">Cómo funciona</h2>
        <ol className="mt-3 space-y-3">
          {[
            'Comparte tu código con tu parche.',
            'Tu amigo lo usa al crear su cuenta.',
            'Hace su primer pedido y tú ganas 300 Street Points.',
            'Él también recibe puntos de bienvenida.',
          ].map((step, index) => (
            <li key={step} className="flex items-start gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-red/15 text-[11px] font-bold text-red">
                {index + 1}
              </span>
              <span className="text-sm text-ash">{step}</span>
            </li>
          ))}
        </ol>
        <Button
          className="mt-4"
          variant="ghost"
          fullWidth
          onClick={() =>
            pushNotification({
              type: 'points',
              title: 'Tu código está listo para compartir',
              body: `Comparte ${code} y gana 300 puntos por cada amigo.`,
              emoji: '🤝',
              actionUrl: '/profile/referrals',
            })
          }
        >
          Recordármelo después
        </Button>
      </div>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-carbon p-4 text-center">
      <span className="mx-auto grid size-9 place-items-center rounded-xl bg-white/[0.05] text-ash">
        {icon}
      </span>
      <p className="mt-2 font-display text-xl text-bone">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-concrete">{label}</p>
    </div>
  )
}
