import { NavLink } from 'react-router-dom'
import { Flame, Gift, Home, User, UtensilsCrossed } from 'lucide-react'
import { SpraySplat } from '@/components/brand/StreetArt'
import { cn } from '@/lib/utils'

const items = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/menu', label: 'Menú', icon: UtensilsCrossed },
  { to: '/drops', label: 'Drops', icon: Flame },
  { to: '/rewards', label: 'Rewards', icon: Gift },
  { to: '/profile', label: 'Perfil', icon: User },
]

export function BottomNav() {
  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-ink/92 backdrop-blur-xl lg:hidden"
      aria-label="Navegación principal"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-1.5">
        {items.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'group flex flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 transition-all duration-200',
                  isActive ? 'text-red' : 'text-concrete active:scale-90',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative grid size-9 place-items-center">
                    {isActive && (
                      <SpraySplat
                        seed={9}
                        className="absolute inset-0 animate-pop text-red/25"
                      />
                    )}
                    <item.icon
                      className={cn(
                        'relative size-[22px] transition-transform duration-200',
                        isActive && '-translate-y-0.5 scale-110',
                      )}
                      strokeWidth={isActive ? 2.6 : 2}
                    />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wide">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
