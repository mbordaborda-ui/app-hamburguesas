import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Bell, Bike, ChefHat, ChevronDown, MapPin, Search, ShoppingBag, Shield } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { cn } from '@/lib/utils'
import { cartCount } from '@/lib/pricing'
import { useAuth } from '@/store/auth'
import { useCart } from '@/store/cart'
import { useDb } from '@/store/db'
import { useUi } from '@/store/ui'

const desktopLinks = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/menu', label: 'Menú' },
  { to: '/drops', label: 'Drops' },
  { to: '/rewards', label: 'Rewards' },
  { to: '/community', label: 'Comunidad' },
]

export function TopBar() {
  const navigate = useNavigate()
  const lines = useCart((s) => s.lines)
  const count = cartCount(lines)
  const openCart = useUi((s) => s.openCart)
  const setNotificationsOpen = useUi((s) => s.setNotificationsOpen)
  const setAddressPickerOpen = useUi((s) => s.setAddressPickerOpen)
  const activeAddressId = useUi((s) => s.activeAddressId)
  const addresses = useDb((s) => s.addresses)
  const unread = useDb((s) => s.notifications.filter((n) => !n.read).length)
  const isAdmin = useAuth((s) => s.user?.role === 'admin')
  const isCourier = useAuth((s) => s.user?.role === 'courier')
  const isKitchen = useAuth((s) => s.user?.role === 'kitchen')

  const active = addresses.find((a) => a.id === activeAddressId) ?? addresses[0]

  return (
    <header className="safe-top sticky top-0 z-50 border-b border-white/[0.07] bg-ink/88 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:h-16 sm:px-6">
        <Link to="/" className="shrink-0" aria-label="Ir al inicio">
          <Logo size="md" className="hidden sm:flex" />
          <span className="text-2xl sm:hidden" aria-hidden>
            🍔
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setAddressPickerOpen(true)}
          className="group ml-1 flex min-w-0 flex-1 items-center gap-1.5 rounded-2xl px-2 py-1.5 text-left transition hover:bg-white/[0.05] lg:ml-4 lg:max-w-xs"
        >
          <MapPin className="size-4 shrink-0 text-red" />
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-concrete">
              Entregar en
            </span>
            <span className="flex items-center gap-1">
              <span className="truncate text-xs font-semibold text-bone">
                {active ? `${active.label} · ${active.line}` : 'Elegir dirección'}
              </span>
              <ChevronDown className="size-3 shrink-0 text-ash transition group-hover:text-red" />
            </span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 lg:flex">
          {desktopLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'rounded-xl px-3.5 py-2 text-sm font-bold uppercase tracking-wide transition',
                  isActive ? 'bg-red/15 text-red' : 'text-ash hover:bg-white/[0.06] hover:text-bone',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          {isCourier && (
            <NavLink
              to="/domiciliario"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold uppercase tracking-wide transition',
                  isActive ? 'bg-orange/20 text-orange' : 'text-ash hover:text-bone',
                )
              }
            >
              <Bike className="size-3.5" /> Domicilios
            </NavLink>
          )}
          {isKitchen && (
            <NavLink
              to="/cocina"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold uppercase tracking-wide transition',
                  isActive ? 'bg-orange/20 text-orange' : 'text-ash hover:text-bone',
                )
              }
            >
              <ChefHat className="size-3.5" /> Cocina
            </NavLink>
          )}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold uppercase tracking-wide transition',
                  isActive ? 'bg-violet/20 text-violet' : 'text-ash hover:text-bone',
                )
              }
            >
              <Shield className="size-3.5" /> Admin
            </NavLink>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {isCourier && (
            <button
              type="button"
              onClick={() => navigate('/domiciliario')}
              aria-label="Módulo domiciliario"
              className="grid size-10 place-items-center rounded-2xl text-orange transition hover:bg-orange/10 lg:hidden"
            >
              <Bike className="size-[19px]" />
            </button>
          )}

          {isKitchen && (
            <button
              type="button"
              onClick={() => navigate('/cocina')}
              aria-label="Módulo de cocina"
              className="grid size-10 place-items-center rounded-2xl text-orange transition hover:bg-orange/10 lg:hidden"
            >
              <ChefHat className="size-[19px]" />
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/menu')}
            aria-label="Buscar"
            className="grid size-10 place-items-center rounded-2xl text-ash transition hover:bg-white/[0.06] hover:text-bone lg:hidden"
          >
            <Search className="size-[19px]" />
          </button>

          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            aria-label="Notificaciones"
            className="relative grid size-10 place-items-center rounded-2xl text-ash transition hover:bg-white/[0.06] hover:text-bone"
          >
            <Bell className="size-[19px]" />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-magenta text-[9px] font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={openCart}
            aria-label="Abrir carrito"
            className="relative flex h-10 items-center gap-2 rounded-2xl bg-red px-3 text-white shadow-primary transition active:scale-95"
          >
            <ShoppingBag className="size-[18px]" />
            <span className="font-display text-base leading-none">{count}</span>
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 size-2.5 animate-pulse-ring rounded-full bg-orange" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
