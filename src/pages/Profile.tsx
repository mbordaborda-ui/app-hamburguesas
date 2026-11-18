import { Link } from 'react-router-dom'
import {
  Bike,
  ChefHat,
  ChevronRight,
  CreditCard,
  Gift,
  Heart,
  LogOut,
  MapPin,
  Package,
  Shield,
  Sparkles,
  Ticket,
  Users,
} from 'lucide-react'
import { SpraySplat, Sticker } from '@/components/brand/StreetArt'
import { UsualOrderCard } from '@/components/profile/UsualOrderCard'
import { Button, LinkButton } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/Feedback'
import { money } from '@/lib/format'
import { showLocalNotification } from '@/lib/push'
import { clearAppCache } from '@/lib/safeStorage'
import { cn } from '@/lib/utils'
import { useFavorites, useLoyalty } from '@/hooks/useLoyalty'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useAuth } from '@/store/auth'
import { useDb } from '@/store/db'
import { toast } from '@/store/ui'

const menu = [
  { to: '/orders', label: 'Mis pedidos', icon: Package, desc: 'Historial y seguimiento' },
  { to: '/profile/favorites', label: 'Favoritos', icon: Heart, desc: 'Tus hamburguesas guardadas' },
  { to: '/profile/addresses', label: 'Direcciones', icon: MapPin, desc: 'Casa, trabajo y más' },
  { to: '/profile/payments', label: 'Métodos de pago', icon: CreditCard, desc: 'Tarjetas, PSE, Nequi' },
  { to: '/profile/coupons', label: 'Cupones', icon: Ticket, desc: 'Códigos y promociones' },
  { to: '/profile/missions', label: 'Misiones y logros', icon: Sparkles, desc: 'Retos activos' },
  { to: '/profile/referrals', label: 'Invita a tu parche', icon: Users, desc: 'Gana puntos por amigos' },
  { to: '/rewards', label: 'Street Points', icon: Gift, desc: 'Canjea tus puntos' },
]

export default function Profile() {
  const user = useAuth((s) => s.user)
  const signOut = useAuth((s) => s.signOut)
  const { account, current, next, percent, remaining } = useLoyalty()
  const favorites = useFavorites()
  const orders = useDb((s) => s.orders)
  const myOrders = user ? orders.filter((o) => o.userId === user.id) : []

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
        <div className="texture-concrete rounded-[28px] border border-white/[0.08] bg-carbon p-6 text-center">
          <span className="text-5xl">👤</span>
          <h1 className="mt-3 font-display text-2xl text-bone">Únete al parche</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm text-ash">
            Crea tu cuenta para guardar favoritos, ver tu historial, acumular Street Points y
            desbloquear el menú secreto.
          </p>
          <div className="mt-5 space-y-2">
            <LinkButton to="/register" fullWidth size="lg">
              Crear cuenta
            </LinkButton>
            <LinkButton to="/login" fullWidth variant="outline" size="lg">
              Ya tengo cuenta
            </LinkButton>
          </div>
          <p className="mt-4 text-xs text-concrete">
            También puedes seguir explorando el menú sin cuenta.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      {/* Header */}
      <header className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-graphite via-carbon to-carbon p-5">
        <div className="texture-brick absolute inset-0 opacity-20" />
        <SpraySplat seed={9} className="absolute -right-14 -top-10 size-52 text-red/[0.09]" />
        <Sticker
          tone="ink"
          rotate={9}
          size="sm"
          className="absolute right-4 top-4 hidden sm:inline-flex"
        >
          {current.emoji} {current.name}
        </Sticker>
        <div className="relative flex items-center gap-4">
          <span className="relative shrink-0">
            <img
              src={user.avatar}
              alt={user.name}
              className="size-16 rounded-2xl border-2 border-red/40 object-cover"
            />
            <span className="absolute -bottom-2 -right-2 grid size-7 place-items-center rounded-full border-2 border-carbon bg-red text-sm">
              {current.emoji}
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl text-bone">{user.name}</h1>
            <p className="truncate text-xs text-ash">{user.email}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Pill tone="volt">
                {current.emoji} {current.name}
              </Pill>
              {user.role === 'admin' && <Pill tone="grape">Admin</Pill>}
            </div>
          </div>
        </div>

        <div className="relative mt-4 space-y-2">
          <div className="flex items-end justify-between">
            <span className="font-display text-2xl text-red">{account.points} pts</span>
            {next && (
              <span className="text-[11px] text-concrete">
                {account.lifetimePoints}/{next.minPoints} para {next.emoji} {next.name}
              </span>
            )}
          </div>
          <ProgressBar value={percent} showGlow />
          {next && (
            <p className="text-[11px] text-ash">
              Te faltan <span className="font-bold text-red">{remaining} pts</span> para el
              siguiente nivel
            </p>
          )}
        </div>

        <dl className="relative mt-4 grid grid-cols-3 gap-2">
          <Stat label="Pedidos" value={String(account.totalOrders)} />
          <Stat label="Gastado" value={money(account.totalSpent)} />
          <Stat label="Favoritos" value={String(favorites.ids.length)} />
        </dl>
      </header>

      <UsualOrderCard className="mt-4" />

      {myOrders.length > 0 && (
        <Link
          to="/orders"
          className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ash transition hover:text-red"
        >
          Ver historial de pedidos <ChevronRight className="size-3.5" />
        </Link>
      )}

      <PushCard />

      {/* Menú */}
      <nav className="mt-5 overflow-hidden rounded-3xl border border-white/[0.08] bg-carbon">
        {menu.map((item, index) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'flex items-center gap-3 px-4 py-3.5 transition hover:bg-white/[0.03]',
              index !== menu.length - 1 && 'border-b border-white/[0.06]',
            )}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-ash">
              <item.icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-bone">{item.label}</span>
              <span className="block text-[11px] text-concrete">{item.desc}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-concrete" />
          </Link>
        ))}
      </nav>

      {user.role === 'courier' && (
        <Link
          to="/domiciliario"
          className="mt-4 flex items-center gap-3 rounded-3xl border border-orange/30 bg-orange/[0.08] p-4 transition hover:border-orange/60"
        >
          <span className="grid size-11 place-items-center rounded-2xl bg-orange/20 text-orange">
            <Bike className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-bold text-bone">Módulo domiciliario</span>
            <span className="block text-[11px] text-ash">
              Tus entregas, direcciones y estados del pedido
            </span>
          </span>
          <ChevronRight className="size-4 text-orange" />
        </Link>
      )}

      {user.role === 'kitchen' && (
        <Link
          to="/cocina"
          className="mt-4 flex items-center gap-3 rounded-3xl border border-orange/30 bg-orange/[0.08] p-4 transition hover:border-orange/60"
        >
          <span className="grid size-11 place-items-center rounded-2xl bg-orange/20 text-orange">
            <ChefHat className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-bold text-bone">Módulo de cocina</span>
            <span className="block text-[11px] text-ash">
              Pedidos por preparar, ingredientes exactos y adicionales
            </span>
          </span>
          <ChevronRight className="size-4 text-orange" />
        </Link>
      )}

      {user.role === 'admin' && (
        <Link
          to="/admin"
          className="mt-4 flex items-center gap-3 rounded-3xl border border-grape/30 bg-grape/[0.08] p-4 transition hover:border-grape/60"
        >
          <span className="grid size-11 place-items-center rounded-2xl bg-grape/20 text-grape">
            <Shield className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-bold text-bone">Panel administrativo</span>
            <span className="block text-[11px] text-ash">
              Productos, pedidos, clientes, pagos y estadísticas
            </span>
          </span>
          <ChevronRight className="size-4 text-grape" />
        </Link>
      )}

      <button
        type="button"
        onClick={() => {
          signOut()
          toast({ title: 'Sesión cerrada', emoji: '👋' })
        }}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-3xl border border-white/10 bg-white/[0.02] py-3.5 text-sm font-bold uppercase tracking-wide text-ash transition hover:border-flame/40 hover:text-flame"
      >
        <LogOut className="size-4" /> Cerrar sesión
      </button>

      <button
        type="button"
        onClick={async () => {
          if (!window.confirm('Esto borra carrito, favoritos y datos locales. ¿Continuar?')) return
          await clearAppCache()
          window.location.reload()
        }}
        className="mt-3 w-full text-center text-[11px] font-bold uppercase tracking-wider text-concrete transition hover:text-flame"
      >
        Solucionar problemas · limpiar caché y datos
      </button>

      <p className="mt-6 text-center text-[11px] text-concrete">
        EL PARCHE · Hecho con hambre en Colombia 🇨🇴
      </p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-concrete">{label}</dt>
      <dd className="mt-0.5 font-display text-sm text-bone">{value}</dd>
    </div>
  )
}

function PushCard() {
  const { supported, permission, busy, enable } = usePushNotifications()

  if (!supported) return null

  const enabled = permission === 'granted'
  const blocked = permission === 'denied'

  const activate = async () => {
    const result = await enable()
    if (result === 'granted') {
      toast({ title: 'Notificaciones activadas', emoji: '🔔', tone: 'success' })
      void showLocalNotification({
        title: 'Listo, parce',
        body: 'Así te avisamos cuando tu pedido salga para tu casa.',
        emoji: '🛵',
        actionUrl: '/orders',
      })
    } else if (result === 'denied') {
      toast({
        title: 'No pudimos activarlas',
        description: 'Revisa los permisos del navegador para este sitio.',
        emoji: '🔕',
        tone: 'error',
      })
    }
  }

  return (
    <section className="mt-4 flex items-start gap-3 rounded-3xl border border-white/[0.08] bg-carbon p-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/[0.05] text-xl">
        {enabled ? '🔔' : '🔕'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-bone">Notificaciones del pedido</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-ash">
          {enabled
            ? 'Activas. Te avisamos en cada cambio de estado, con la app abierta o en segundo plano.'
            : blocked
              ? 'Están bloqueadas en tu navegador. Habilítalas en los ajustes del sitio.'
              : 'Actívalas y te avisamos cuando tu pedido esté en camino.'}
        </p>
        {enabled ? (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() =>
              void showLocalNotification({
                title: 'Prueba de notificación',
                body: 'Todo listo: te avisaremos en cada paso de tu pedido.',
                emoji: '🍔',
                actionUrl: '/orders',
              })
            }
          >
            Enviar prueba
          </Button>
        ) : (
          !blocked && (
            <Button size="sm" className="mt-2" loading={busy} onClick={activate}>
              Activar notificaciones
            </Button>
          )
        )}
      </div>
    </section>
  )
}
