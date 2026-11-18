import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Clock,
  CreditCard,
  Flame,
  LayoutDashboard,
  LogOut,
  Package,
  Percent,
  Receipt,
  ShoppingBag,
  Users,
} from 'lucide-react'
import { Pill } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/auth'
import { useDb } from '@/store/db'

const links = [
  { to: '/admin', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Pedidos', icon: ShoppingBag },
  { to: '/admin/products', label: 'Productos', icon: Package },
  { to: '/admin/customers', label: 'Clientes', icon: Users },
  { to: '/admin/promos', label: 'Promociones', icon: Percent },
  { to: '/admin/rewards', label: 'Rewards', icon: Flame },
  { to: '/admin/drops', label: 'Drops', icon: Flame },
  { to: '/admin/payments', label: 'Pagos', icon: CreditCard },
  { to: '/admin/invoices', label: 'Facturas', icon: Receipt },
  { to: '/admin/stats', label: 'Estadísticas', icon: BarChart3 },
  { to: '/admin/settings', label: 'Horario', icon: Clock },
]

export default function AdminLayout() {
  const user = useAuth((s) => s.user)
  const signOut = useAuth((s) => s.signOut)
  const orders = useDb((s) => s.orders)
  const navigate = useNavigate()

  const pending = orders.filter((o) => ['received', 'confirmed', 'preparing'].includes(o.status)).length

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-marker text-sm text-grape">Panel administrativo</p>
          <h1 className="font-display text-2xl text-bone sm:text-3xl">EL PARCHE HQ</h1>
          <p className="mt-0.5 text-xs text-ash">
            {user?.name} · {user?.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone="volt">{pending} por atender</Pill>
          <button
            type="button"
            onClick={() => {
              signOut()
              navigate('/')
            }}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-white/10 px-3 text-[11px] font-bold uppercase tracking-wider text-ash transition hover:border-flame/40 hover:text-flame"
          >
            <LogOut className="size-3.5" /> Salir
          </button>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-xs font-bold uppercase tracking-wide transition',
                  isActive
                    ? 'border-grape/50 bg-grape/[0.12] text-bone'
                    : 'border-white/[0.07] bg-carbon text-ash hover:border-white/20 hover:text-bone',
                )
              }
            >
              <link.icon className="size-4" />
              <span className="whitespace-nowrap">{link.label}</span>
              {link.to === '/admin/orders' && pending > 0 && (
                <span className="ml-auto hidden size-5 place-items-center rounded-full bg-flame text-[10px] text-white lg:grid">
                  {pending}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
